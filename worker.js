export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const url = new URL(request.url);
    let mobileNumber = url.searchParams.get("number");

    if (!mobileNumber) {
      return new Response(JSON.stringify({ success: false, message: "Provide a number." }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // --- नंबर क्लीनिंग लॉजिक (ताकि फ्रंटएंड पर कोई फर्क न पड़े) ---
    // सभी स्पेस या डैश हटाएं
    let cleanNumber = mobileNumber.replace(/\D/g, ""); 
    
    // अगर नंबर 923 से शुरू हो रहा है तो 92 हटाकर 3 से शुरू करें
    if (cleanNumber.startsWith("92")) {
      cleanNumber = cleanNumber.substring(2);
    }
    // अगर नंबर 03 से शुरू हो रहा है तो 0 हटाकर 3 से शुरू करें
    else if (cleanNumber.startsWith("0")) {
      cleanNumber = cleanNumber.substring(1);
    }

    try {
      // --- STEP 1: नई API से डेटा प्राप्त करें (बिना 0 या 92 के, सिर्फ 3xx से शुरू) ---
      const searchUrl = `https://amscript.xyz/PublicApi/Siminfo.php?number=${cleanNumber}`;
      const res = await fetch(searchUrl);
      const data = await res.json();

      // अगर डेटा नहीं मिला या स्टेटस फेल है
      if (!data || data.status === "fail" || !data.data) {
        return new Response(JSON.stringify({ success: false, message: "No record found for this number." }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // --- STEP 2: नई API के रिस्पॉन्स को आपके पुराने फॉर्मेट में ढालना ---
      // नोट: चूंकि नई API का रिस्पॉन्स स्ट्रक्चर थोड़ा अलग हो सकता है, 
      // हम उसे एरे (Array) में मैप कर रहे हैं ताकि पुराना फ्रंटएंड बिना किसी बदलाव के चले।
      
      const apiData = data.data;
      const targetCNIC = apiData.cnic || "N/A";

      const allRecords = [{
        number: apiData.phone || mobileNumber, // ओरिजिनल इनपुट नंबर या मिला हुआ नंबर
        name: apiData.name || "N/A",
        cnic: targetCNIC,
        address: apiData.address || "N/A",
        developed_by: "Ramzan Ahsan"
      }];

      // --- STEP 3: पुराना सेम टू सेम JSON रिस्पॉन्स वापस भेजें ---
      return new Response(
        JSON.stringify({
          success: true,
          query_number: mobileNumber, // फ्रंटएंड को ओरिजिनल इनपुट ही दिखेगा
          linked_cnic: targetCNIC,
          total_sims_found: allRecords.length,
          data: allRecords,
          credit: "Developed by Ramzan Ahsan"
        }, null, 2),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  },
};
