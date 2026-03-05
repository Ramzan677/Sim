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
          message: "Please provide a number. Example: ?number=0333xxxxxxx",
          developed_by: "Ramzan Ahsan"
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    try {
      // --- STEP A: Fetch data from Sychosim Database ---
      // We send the query (mobile number) to the new API endpoint
      const apiUrl = `https://sychosimdatabase.vercel.app/api/lookup?query=${mobileNumber}`;
      const response = await fetch(apiUrl);
      const result = await response.json();

      // --- STEP B: Validate and Extract ---
      // Checking if the API returned data successfully
      if (!result || !result.data || (Array.isArray(result.data) && result.data.length === 0)) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "No records found for this number in Sychosim Database.",
            developed_by: "Ramzan Ahsan"
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // --- STEP C: Format the Response ---
      // Mapping the external API fields to your specific clean format
      const records = Array.isArray(result.data) ? result.data : [result.data];
      
      const cleanResults = records.map(item => ({
        number: item.mobile || item.number || mobileNumber,
        name: item.name || "N/A",
        cnic: item.cnic || "N/A",
        address: item.address || "N/A",
        operator: item.operator || "N/A",
        developed_by: "Ramzan Ahsan"
      }));

      // --- STEP D: Return Final JSON ---
      return new Response(
        JSON.stringify({
          success: true,
          query: mobileNumber,
          total_found: cleanResults.length,
          data: cleanResults,
          credit: "Developed by Ramzan Ahsan"
        }, null, 2), 
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "The Sychosim API is currently unreachable.",
          error: error.message,
          developed_by: "Ramzan Ahsan"
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  },
};
