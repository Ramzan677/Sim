export default {
  async fetch(request, env, ctx) {
    // 1. Setup CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const mobileNumber = url.searchParams.get("number");

    if (!mobileNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Please provide a number. Example: ?number=3338570120",
          developed_by: "Ramzan Ahsan"
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    try {
      // --- STEP A: Search by Number to get CNIC from new API ---
      const response1 = await fetch(`https://fam-official.serv00.net/api/database.php?number=${mobileNumber}`);
      const data1 = await response1.json();

      // Check if records exist in the new structure
      if (!data1.success || !data1.data || !data1.data.records || data1.data.records.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "No record found for this number.",
            developed_by: "Ramzan Ahsan"
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Extract CNIC from the first record found
      const targetCNIC = data1.data.records[0].cnic;

      if (!targetCNIC) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "CNIC not found in the database records.",
            developed_by: "Ramzan Ahsan"
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // --- STEP B: Search by CNIC to get Multi Data ---
      // We use the same API endpoint as it supports both Number and CNIC
      const response2 = await fetch(`https://fam-official.serv00.net/api/database.php?number=${targetCNIC}`);
      const data2 = await response2.json();

      // --- STEP C: Filter and Format Data ---
      // Mapping the new keys (full_name, phone) to your standard format (name, number)
      const cleanResults = data2.data.records.map(item => ({
        number: item.phone,
        name: item.full_name,
        cnic: item.cnic,
        address: item.address,
        developed_by: "Ramzan Ahsan"
      }));

      // --- STEP D: Return Final JSON ---
      return new Response(
        JSON.stringify({
          success: true,
          query_number: mobileNumber,
          linked_cnic: targetCNIC,
          total_sims: data2.data.records_count,
          data: cleanResults,
          credit: "Developed by Ramzan Ahsan"
        }, null, 2), 
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Server Error or Source API is down.",
          error: error.message,
          developed_by: "Ramzan Ahsan"
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  },
};
