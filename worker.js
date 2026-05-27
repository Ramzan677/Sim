export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // CORS preflight रिक्वेस्ट को हैंडल करें
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    let mobileNumber = url.searchParams.get("number");

    if (!mobileNumber) {
      return new Response(JSON.stringify({ success: false, message: "Provide a number." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // --- नंबर क्लीनिंग लॉजिक ---
    let cleanNumber = mobileNumber.replace(/\D/g, ""); 
    
    if (cleanNumber.startsWith("92")) {
      cleanNumber = cleanNumber.substring(2);
    } else if (cleanNumber.startsWith("0")) {
      cleanNumber = cleanNumber.substring(1);
    }

    try {
      // --- STEP 1: नई API से डेटा प्राप्त करें ---
      const searchUrl = `https://amscript.xyz/PublicApi/Siminfo.php?number=${cleanNumber}`;
      
      // 5 सेकंड का टाइमआउट सेट करें ताकि वर्कर अटका न रहे
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(searchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      // अगर API रिस्पॉन्स कोड 200-299 के बीच नहीं है
      if (!res.ok) {
        throw new Error(`Third-party API responded with status ${res.status}`);
      }

      const data = await res.json();

      // --- STEP 2: रिस्पॉन्स वैलिडेशन ---
      // 'fail' स्टेटस या खाली डेटा होने पर सुरक्षित रूप से हैंडल करें
      if (!data || data.status === "fail" || !data.data) {
        return new Response(JSON.stringify({ success: false, message: "No record found for this number." }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // अगर डेटा एरे के रूप में आता है तो पहला एलिमेंट लें, नहीं तो डायरेक्ट ऑब्जेक्ट यूज़ करें
      const apiData = Array.isArray(data.data) ? data.data[0] : data.data;

      if (!apiData) {
        return new Response(JSON.stringify({ success: false, message: "No record found for this number." }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const targetCNIC = apiData.cnic || "N/A";

      const allRecords = [{
        number: apiData.phone || mobileNumber,
        name: apiData.name || "N/A",
        cnic: targetCNIC,
        address: apiData.address || "N/A",
        developed_by: "Ramzan Ahsan"
      }];

      // --- STEP 3: पुराना फॉर्मेट JSON रिस्पॉन्स ---
      return new Response(
        JSON.stringify({
          success: true,
          query_number: mobileNumber,
          linked_cnic: targetCNIC,
          total_sims_found: allRecords.length,
          data: allRecords,
          credit: "Developed by Ramzan Ahsan"
        }, null, 2),
        { 
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );

    } catch (error) {
      // एरर मैसेज को सुरक्षित रूप से फ्रंटएंड पर भेजें
      return new Response(JSON.stringify({ success: false, error: error.message || "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  },
};
