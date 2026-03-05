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
      // The exact API endpoint you requested
      const apiUrl = `https://sychosimdatabase.vercel.app/api/lookup?query=${mobileNumber}`;
      const response = await fetch(apiUrl);
      const result = await response.json();

      // Based on your sample, the data is inside the "results" array
      const records = result.results;

      if (!records || !Array.isArray(records) || records.length === 0) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "No Data Found in Sychox Database",
          developed_by: "Ramzan Ahsan"
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // Mapping keys: name, cnic, address, and mobile (from API)
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
          query: mobileNumber,
          results_count: result.results_count || cleanResults.length,
          data: cleanResults,
          credit: "Developed by Ramzan Ahsan"
        }, null, 2),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "API Error", 
        error: error.message 
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  },
};
