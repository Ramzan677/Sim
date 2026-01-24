export default {
  async fetch(request, env, ctx) {
    // 1. Setup CORS headers so you can use this API anywhere
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight requests (Browser checks)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. Get the Number from the URL (e.g., ?number=923017496496)
    const url = new URL(request.url);
    const mobileNumber = url.searchParams.get("number");

    if (!mobileNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Please provide a number. Example: ?number=923017496496",
          developed_by: "Ramzan Ahsan"
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    try {
      // --- STEP A: Search by Number to get CNIC ---
      // We use the native 'fetch' instead of axios
      const response1 = await fetch(`https://sychosimdatabase.vercel.app/api/lookup/${mobileNumber}`);
      const data1 = await response1.json();

      // Check if data exists
      if (!data1.success || !data1.results || data1.results.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "No record found for this number.",
            developed_by: "Ramzan Ahsan"
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Extract CNIC
      const targetCNIC = data1.results[0].cnic;

      if (!targetCNIC) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "CNIC not found in the record.",
            developed_by: "Ramzan Ahsan"
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // --- STEP B: Search by CNIC to get Multi Data ---
      const response2 = await fetch(`https://sychosimdatabase.vercel.app/api/lookup/${targetCNIC}`);
      const data2 = await response2.json();

      // --- STEP C: Filter and Format Data ---
      const cleanResults = data2.results.map(item => ({
        number: item.mobile,
        name: item.name,
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
          total_sims: cleanResults.length,
          data: cleanResults,
          credit: "Developed by Ramzan Ahsan"
        }, null, 2), // The '2' makes the JSON look pretty
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
