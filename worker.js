export default {
  async fetch(request, env, ctx) {
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
      // Clean the number (remove leading zero or add 92 if needed, though usually, simple query works)
      const query = mobileNumber.trim();
      
      const apiUrl = `https://sychosimdatabase.vercel.app/api/lookup?query=${query}`;
      const response = await fetch(apiUrl);
      const result = await response.json();

      // DEBUG: If no data field exists, the structure might be direct
      let rawData = result.data || result.records || result;

      // Ensure we are working with an array
      if (!Array.isArray(rawData)) {
        rawData = rawData && typeof rawData === 'object' && Object.keys(rawData).length > 0 ? [rawData] : [];
      }

      if (rawData.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "No record found in the database.",
            developed_by: "Ramzan Ahsan"
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Map the data using flexible key detection
      const cleanResults = rawData.map(item => ({
        number: item.mobile || item.number || item.phone || mobileNumber,
        name: item.name || item.full_name || item.FullName || "N/A",
        cnic: item.cnic || item.nic || item.id_card || "N/A",
        address: item.address || item.location || "N/A",
        operator: item.operator || item.network || "N/A",
        developed_by: "Ramzan Ahsan"
      }));

      return new Response(
        JSON.stringify({
          success: true,
          query_number: mobileNumber,
          total_records: cleanResults.length,
          data: cleanResults,
          credit: "Developed by Ramzan Ahsan"
        }, null, 2), 
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "API Source Error.",
          error: error.message,
          developed_by: "Ramzan Ahsan"
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  },
};
