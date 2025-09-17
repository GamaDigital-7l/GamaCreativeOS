import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { parse as parseCsv } from "https://deno.land/std@0.190.0/csv/mod.ts";
import * as XLSX from "https://esm.sh/xlsx@0.18.5"; // For Excel parsing

// Import Google Cloud Vision client for Deno (example, actual client might vary)
// In a real Deno project, you might use a specific Deno-compatible client or direct fetch to the API.
// For simplicity, this is a conceptual import.
// const { ImageAnnotatorClient } = await import('https://esm.sh/@google-cloud/vision@3.1.4'); // This is a Node.js client, won't work directly in Deno without polyfills.
// A direct fetch to the Google Cloud Vision REST API would be more appropriate for Deno.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Helper Functions for Data Normalization and Parsing ---

// Normalizes phone numbers to +55DDDNNNNNNNN
function normalizePhoneNumber(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) { // Assuming at least 10 digits for valid phone
    // Add +55 if not present and it looks like a Brazilian number
    if (!digits.startsWith('55') && digits.length === 10 || digits.length === 11) {
      return `+55${digits}`;
    }
    return `+${digits}`;
  }
  return null;
}

// Normalizes dates to ISO 8601
function normalizeDate(dateString?: string): string | null {
  if (!dateString) return null;
  try {
    // Try parsing common formats
    let date;
    if (dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)) { // Already ISO
      date = new Date(dateString);
    } else if (dateString.match(/^\d{2}\/\d{2}\/\d{4}( \d{2}:\d{2}(:\d{2})?)?$/)) { // DD/MM/YYYY HH:mm:ss
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('/').map(Number);
      date = new Date(year, month - 1, day);
      if (timePart) {
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        date.setHours(hours || 0, minutes || 0, seconds || 0);
      }
    } else if (dateString.match(/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/)) { // YYYY-MM-DD HH:mm:ss
      date = new Date(dateString);
    } else {
      date = new Date(dateString); // Fallback to generic Date parsing
    }

    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  } catch (e) {
    console.error("Error normalizing date:", dateString, e);
    return null;
  }
}

// Maps ShoFicina status to internal system status
function mapStatus(shoficinaStatus?: string): string {
  if (!shoficinaStatus) return 'pending';
  const lowerStatus = shoficinaStatus.toLowerCase();
  if (lowerStatus.includes('aberta') || lowerStatus.includes('pendente')) return 'pending';
  if (lowerStatus.includes('andamento') || lowerStatus.includes('progresso')) return 'in_progress';
  if (lowerStatus.includes('aguardando') || lowerStatus.includes('aprovacao')) return 'pending_approval';
  if (lowerStatus.includes('concluida') || lowerStatus.includes('finalizada')) return 'completed';
  if (lowerStatus.includes('cancelada') || lowerStatus.includes('rejeitada')) return 'cancelled';
  return 'in_progress'; // Default if no match
}

// Parses parts list from string (e.g., "1x Tela - R$100; 2x Bateria - R$50")
function parseParts(partsString?: string): Array<{ description: string; qty: number; unit_price: number }> | null {
  if (!partsString) return null;
  const parts: Array<{ description: string; qty: number; unit_price: number }> = [];
  const items = partsString.split(';');
  items.forEach(item => {
    const match = item.match(/(\d+)x\s*(.*?)\s*-\s*R\$(\d+(\.\d{1,2})?)/i);
    if (match) {
      parts.push({
        description: match[2].trim(),
        qty: parseInt(match[1]),
        unit_price: parseFloat(match[3]),
      });
    } else {
      // Fallback for simpler entries
      parts.push({ description: item.trim(), qty: 1, unit_price: 0 });
    }
  });
  return parts.length > 0 ? parts : null;
}

// --- OCR Integration (Conceptual) ---
async function extractTextFromPdfWithAI(file: File): Promise<string> {
  const GOOGLE_CLOUD_VISION_API_KEY = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
  if (!GOOGLE_CLOUD_VISION_API_KEY) {
    throw new Error('GOOGLE_CLOUD_VISION_API_KEY is not set in Supabase Secrets.');
  }

  // Convert File to Base64 for Google Cloud Vision API
  const arrayBuffer = await file.arrayBuffer();
  const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

  const requestBody = {
    requests: [{
      inputConfig: {
        mimeType: 'application/pdf',
        content: base64Pdf,
      },
      features: [{
        type: 'DOCUMENT_TEXT_DETECTION',
      }],
      // Optional: Add pages for specific processing
      // pages: [1], 
    }],
  };

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/files:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Cloud Vision API Error:", errorData);
      throw new Error(`Google Cloud Vision API failed: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    // Google Cloud Vision for PDF returns a list of page responses
    // We'll concatenate all text for simplicity
    const fullText = result.responses
      .map((res: any) => res.fullTextAnnotation?.text)
      .filter(Boolean)
      .join('\n');

    if (!fullText) {
      throw new Error('No text extracted from PDF by Google Cloud Vision.');
    }
    return fullText;

  } catch (e) {
    console.error("Error calling Google Cloud Vision API:", e);
    throw new Error(`Failed to process PDF with AI: ${e.message}`);
  }
}

// Parses text content (from PDF OCR or other text files) using regex
function parseTextContent(textContent: string): any {
  const data: any = {};
  const lines = textContent.split('\n');

  const regexMap = {
    'os_number': /(?:Nº OS|Número|Protocolo):\s*([^\n]+)/i,
    'opened_at': /(?:Data de abertura|Aberto em):\s*([^\n]+)/i,
    'closed_at': /(?:Data de fechamento|Fechado em):\s*([^\n]+)/i,
    'status': /(?:Status):\s*([^\n]+)/i,
    'customer_name': /(?:Cliente \(nome\)|Cliente):\s*([^\n]+)/i,
    'customer_phone': /(?:Telefone|WhatsApp):\s*([^\n]+)/i,
    'customer_tax_id': /(?:CPF\/CNPJ):\s*([^\n]+)/i,
    'customer_address': /(?:Endereço):\s*([^\n]+)/i,
    'asset_make': /(?:Veículo\/Equipamento \(marca\)|Marca):\s*([^\n]+)/i,
    'asset_model': /(?:Modelo):\s*([^\n]+)/i,
    'asset_identifier': /(?:Placa \/ IMEI \/ Série|IMEI|Série):\s*([^\n]+)/i,
    'problem_reported': /(?:Defeito relatado|Problema):\s*([^\n]+)/i,
    'diagnosis': /(?:Diagnóstico):\s*([^\n]+)/i,
    'service_performed': /(?:Serviço executado|Serviço):\s*([^\n]+)/i,
    'parts_list': /(?:Peças \(lista\)|Peças):\s*([^\n]+)/i,
    'labor_amount': /(?:Mão de obra):\s*([^\n]+)/i,
    'discount_amount': /(?:Descontos):\s*([^\n]+)/i,
    'total_amount': /(?:Total):\s*([^\n]+)/i,
    'payments': /(?:Forma de pagamento|Pagamento):\s*([^\n]+)/i,
    'notes': /(?:Observações):\s*([^\n]+)/i,
    'technician': /(?:Responsável\/técnico|Técnico):\s*([^\n]+)/i,
  };

  for (const key in regexMap) {
    const match = textContent.match(regexMap[key as keyof typeof regexMap]);
    if (match && match[1]) {
      data[key] = match[1].trim();
    }
  }

  // Special handling for parts and payments which are arrays
  if (data.parts_list) {
    data.parts = parseParts(data.parts_list);
    delete data.parts_list;
  }
  if (data.payments) {
    // Assuming payments string like "PIX - 800.00 - 05/08/2023 15:00; Cartão - 100.00 - 06/08/2023"
    data.payments = data.payments.split(';').map((p: string) => {
      const parts = p.split(' - ').map(s => s.trim());
      return {
        method: parts[0],
        amount: parseFloat(parts[1]) || 0,
        paid_at: normalizeDate(parts[2]) || null,
      };
    }).filter((p: any) => p.method && p.amount > 0);
  }

  return data;
}

// --- Main Edge Function Handler ---

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid user session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const userId = formData.get('user_id') as string;

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file uploaded' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const fileName = file.name.toLowerCase();
  let rawData: any[] = [];
  const importReport: ImportReportEntry[] = [];

  try {
    if (fileName.endsWith('.csv')) {
      const text = await file.text();
      rawData = parseCsv(text, { skipFirstRow: true, separator: ',', columns: true }); // Assuming comma separated and first row is headers
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else if (fileName.endsWith('.pdf')) {
      const textContent = await extractTextFromPdfWithAI(file); // Use AI for PDF OCR
      rawData = [parseTextContent(textContent)]; // Assume one OS per PDF for now
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported file type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    for (const item of rawData) {
      const osNumberFromSource = String(item['Nº OS'] || item['Número'] || item['Protocolo'] || '').trim();
      const entry: ImportReportEntry = { os_number: osNumberFromSource || 'UNKNOWN', status: 'failed', messages: [] };
      
      if (!osNumberFromSource) {
        entry.messages.push('Error: Número da OS é obrigatório e não foi encontrado.');
        importReport.push(entry);
        continue;
      }
      entry.os_number = osNumberFromSource; // Update os_number in report entry

      try {
        // Normalize and map fields
        const normalizedData = {
          os_number: osNumberFromSource,
          opened_at: normalizeDate(item['Data de abertura']),
          closed_at: normalizeDate(item['Data de fechamento']),
          status: mapStatus(item['Status']),
          issue_description: item['Defeito relatado'] || item['Problema relatado'],
          service_details: item['Serviço executado'] || item['Diagnóstico'],
          parts_cost: parseFloat(String(item['Mão de obra'] || '0').replace(',', '.')), // Assuming labor_amount is parts_cost for simplicity
          service_cost: parseFloat(String(item['Mão de obra'] || '0').replace(',', '.')), // Assuming labor_amount is service_cost for simplicity
          total_amount: parseFloat(String(item['Total'] || '0').replace(',', '.')),
          freight_cost: parseFloat(String(item['Frete'] || '0').replace(',', '.')),
          guarantee_terms: item['Observações'] || item['Notas'], // Using notes for guarantee terms if available
          warranty_days: 90, // Default warranty days
          customer_signature: null, // Not importing signatures from ShoFicina PDF directly
          approved_at: null,
          client_checklist: {},
          is_untestable: false,
          casing_status: null,
        };

        // Handle customer
        let customerId: string | null = null;
        const customerName = item['Cliente (nome)'] || item['Cliente'];
        const customerPhone = normalizePhoneNumber(item['Telefone'] || item['WhatsApp']);
        const customerEmail = item['Email'];
        const customerAddress = item['Endereço'];
        const customerTaxId = String(item['CPF/CNPJ'] || '').replace(/\D/g, '');

        if (customerName) {
          let { data: existingCustomer, error: customerFetchError } = await supabase
            .from('customers')
            .select('id')
            .eq('user_id', userId)
            .ilike('name', customerName)
            .single();

          if (customerFetchError && customerFetchError.code !== 'PGRST116') { // PGRST116 means no rows found
            entry.messages.push(`Warning: Erro ao buscar cliente existente: ${customerFetchError.message}`);
          }

          if (existingCustomer) {
            customerId = existingCustomer.id;
          } else {
            const { data: newCustomer, error: newCustomerError } = await supabase
              .from('customers')
              .insert({
                user_id: userId,
                name: customerName,
                phone: customerPhone,
                email: customerEmail,
                address: customerAddress,
              })
              .select('id')
              .single();
            if (newCustomerError) throw newCustomerError;
            customerId = newCustomer.id;
            entry.messages.push(`Info: Cliente '${customerName}' criado.`);
          }
        } else {
          entry.messages.push('Warning: Nome do cliente não encontrado. OS será criada sem cliente associado.');
        }

        // Handle device
        let deviceId: string | null = null;
        const deviceBrand = item['Veículo/Equipamento (marca)'] || item['Marca'];
        const deviceModel = item['Modelo'];
        const deviceIdentifier = item['Placa / IMEI / Série'] || item['IMEI'] || item['Série'];

        if (deviceBrand && deviceModel) {
          let { data: existingDevice, error: deviceFetchError } = await supabase
            .from('devices')
            .select('id')
            .eq('user_id', userId)
            .eq('brand', deviceBrand)
            .eq('model', deviceModel)
            .eq('serial_number', deviceIdentifier)
            .single();

          if (deviceFetchError && deviceFetchError.code !== 'PGRST116') {
            entry.messages.push(`Warning: Erro ao buscar dispositivo existente: ${deviceFetchError.message}`);
          }

          if (existingDevice) {
            deviceId = existingDevice.id;
          } else {
            const { data: newDevice, error: newDeviceError } = await supabase
              .from('devices')
              .insert({
                user_id: userId,
                customer_id: customerId,
                brand: deviceBrand,
                model: deviceModel,
                serial_number: deviceIdentifier,
                defect_description: normalizedData.issue_description,
              })
              .select('id')
              .single();
            if (newDeviceError) throw newDeviceError;
            deviceId = newDevice.id;
            entry.messages.push(`Info: Dispositivo '${deviceBrand} ${deviceModel}' criado.`);
          }
        } else {
          entry.messages.push('Warning: Marca e/ou modelo do dispositivo não encontrados. OS será criada sem dispositivo associado.');
        }

        // Handle supplier for parts
        let partSupplierId: string | null = null;
        const supplierName = item['Fornecedor da Peça'] || item['Fornecedor'];
        if (supplierName) {
          let { data: existingSupplier, error: supplierFetchError } = await supabase
            .from('suppliers')
            .select('id')
            .eq('user_id', userId)
            .ilike('name', supplierName)
            .single();
          
          if (supplierFetchError && supplierFetchError.code !== 'PGRST116') {
            entry.messages.push(`Warning: Erro ao buscar fornecedor existente: ${supplierFetchError.message}`);
          }

          if (existingSupplier) {
            partSupplierId = existingSupplier.id;
          } else {
            const { data: newSupplier, error: newSupplierError } = await supabase
              .from('suppliers')
              .insert({ user_id: userId, name: supplierName })
              .select('id')
              .single();
            if (newSupplierError) throw newSupplierError;
            partSupplierId = newSupplier.id;
            entry.messages.push(`Info: Fornecedor '${supplierName}' criado.`);
          }
        }

        // Upsert Service Order
        const serviceOrderPayload = {
          user_id: userId,
          customer_id: customerId,
          device_id: deviceId,
          os_number: normalizedData.os_number, // Use the new os_number column
          created_at: normalizedData.opened_at,
          updated_at: normalizedData.closed_at || new Date().toISOString(),
          status: normalizedData.status,
          issue_description: normalizedData.issue_description,
          service_details: normalizedData.service_details,
          parts_cost: normalizedData.parts_cost,
          service_cost: normalizedData.service_cost,
          total_amount: normalizedData.total_amount,
          freight_cost: normalizedData.freight_cost,
          part_supplier_id: partSupplierId,
          guarantee_terms: normalizedData.guarantee_terms,
          warranty_days: normalizedData.warranty_days,
          // Other fields can be added here
        };

        const { data: existingOS, error: fetchOSError } = await supabase
          .from('service_orders')
          .select('id, issue_description, service_details, total_amount') // Select fields for content hash
          .eq('user_id', userId)
          .eq('os_number', normalizedData.os_number) // Use os_number for deduplication
          .single();

        if (fetchOSError && fetchOSError.code !== 'PGRST116') {
          throw fetchOSError;
        }

        if (existingOS) {
          // Check for content changes for idempotency
          const isContentChanged = 
            existingOS.issue_description !== serviceOrderPayload.issue_description ||
            existingOS.service_details !== serviceOrderPayload.service_details ||
            existingOS.total_amount !== serviceOrderPayload.total_amount; // Simplified content comparison

          if (isContentChanged) {
            const { error: updateError } = await supabase
              .from('service_orders')
              .update(serviceOrderPayload)
              .eq('id', existingOS.id);
            if (updateError) throw updateError;
            entry.status = 'updated';
            entry.messages.push('Info: Ordem de Serviço atualizada (conteúdo divergente).');
          } else {
            entry.status = 'skipped';
            entry.messages.push('Info: Ordem de Serviço ignorada (já existe e conteúdo idêntico).');
          }
        } else {
          const { error: insertError } = await supabase
            .from('service_orders')
            .insert(serviceOrderPayload);
          if (insertError) throw insertError;
          entry.status = 'created';
          entry.messages.push('Info: Ordem de Serviço criada.');
        }

      } catch (e: any) {
        entry.status = 'failed';
        entry.messages.push(`Error: ${e.message || 'Erro desconhecido ao processar OS.'}`);
      }
      importReport.push(entry);
    }

    return new Response(JSON.stringify(importReport), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Global error in Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});