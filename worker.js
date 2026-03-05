export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const url = new URL(request.url);
    const mobileNumber = url.searchParams.get("number");

    if (!mobileNumber) {
      return new Response(JSON.stringify({ success: false, message: "Provide a number." }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    try {
      // --- STEP 1: Get the CNIC for the provided number ---
      const searchUrl = `https://sychosimdatabase.vercel.app/api/lookup?query=${mobileNumber}`;
      const res1 = await fetch(searchUrl);
      const data1 = await res1.json();

      if (!data1.results || data1.results.length === 0) {
        return new Response(JSON.stringify({ success: false, message: "No record found for this number." }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // Extract the CNIC from the first result
      const targetCNIC = data1.results[0].cnic;

      if (!targetCNIC || targetCNIC === "N/A") {
        return new Response(JSON.stringify({ success: false, message: "CNIC not found for this number." }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // --- STEP 2: Use that CNIC to find MULTI DATA (All SIMs) ---
      const multiUrl = `https://sychosimdatabase.vercel.app/api/lookup?query=${targetCNIC}`;
      const res2 = await fetch(multiUrl);
      const data2 = await res2.json();

      // --- STEP 3: Format and Return All Records ---
      const allRecords = (data2.results || []).map(item => ({
        number: item.mobile || item.number || "N/A",
        name: item.name || "N/A",
        cnic: item.cnic || targetCNIC,
        address: item.address || "N/A",
        developed_by: "Ramzan Ahsan"
      }));

      return new Response(
        JSON.stringify({
          success: true,
          query_number: mobileNumber,
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
