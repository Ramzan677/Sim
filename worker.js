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
      const res = await fetch(searchUrl);
      const data = await res.json();

      // Agar data nahi mila ya success false hai
      if (!data || data.success === false || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
        return new Response(JSON.stringify({ success: false, message: "No record found for this number." }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // --- STEP 2: MULTI-DATA MAPPING (Sahi Name aur Saare Records ke liye) ---
      // Hum pooray array par '.map()' chala rahe hain taaki agar 1 se zyada records hon toh sab convert ho jayein
      const allRecords = data.data.map(apiData => {
        return {
          number: apiData.phone || mobileNumber,
          name: apiData.full_name || "N/A", // <-- Yahan 'full_name' set kar diya hai taaki naam theek aaye
          cnic: apiData.cnic || "N/A",
          address: apiData.address || "N/A",
          developed_by: "Ramzan Ahsan"
        };
      });

      // Target CNIC ke liye pehle record ka CNIC utha lete hain (Purane format ke liye)
      const targetCNIC = allRecords[0].cnic || "N/A";

      // --- STEP 3: पुराना सेम टू सेम JSON रिस्पॉन्स वापस भेजें ---
      return new Response(
        JSON.stringify({
          success: true,
          query_number: mobileNumber, 
          linked_cnic: targetCNIC,
          total_sims_found: allRecords.length, // Jitne records milenge unka total count
          data: allRecords,                   // Saare records ka array (Multi-data support)
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
