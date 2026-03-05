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
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Please provide a number. Example: ?number=923016486486" 
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    try {
      // Fetching from the Sychosim Database Vercel API
      const apiUrl = `https://sychosimdatabase.vercel.app/api/lookup?query=${mobileNumber}`;
      const response = await fetch(apiUrl);
      const result = await response.json();

      // IMPORTANT: The API uses "results" (as seen in your sample)
      const records = result.results;

      // If results is missing or empty, return false
      if (!records || !Array.isArray(records) || records.length === 0) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "No Data Found for this number",
          developed_by: "Ramzan Ahsan"
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // Mapping keys exactly: mobile, name, cnic, address
      const cleanResults = records.map(item => ({
        number: item.mobile || mobileNumber,
        name: item.name || "N/A",
        cnic: item.cnic || "N/A",
        address: item.address || "N/A",
        developed_by: "Ramzan Ahsan"
      }));

      return new Response(
        JSON.stringify({
          success: true,
          query_number: mobileNumber,
          total_records: result.results_count || cleanResults.length,
          data: cleanResults,
          credit: "Developed by Ramzan Ahsan"
        }, null, 2),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "API Connection Error", 
        error: error.message 
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  },
};
