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
      return new Response(JSON.stringify({ success: false, message: "Add ?number=0333xxxxxxx" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    try {
      // The API often prefers the 92 prefix or local format; this query remains flexible.
      const apiUrl = `https://sychosimdatabase.vercel.app/api/lookup?query=${mobileNumber}`;
      const response = await fetch(apiUrl);
      const result = await response.json();

      // Locate the data array regardless of where the API nests it
      let rawData = result.data || result.records || (Array.isArray(result) ? result : null);

      if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
        return new Response(JSON.stringify({ success: false, message: "No Data Found" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const records = Array.isArray(rawData) ? rawData : [rawData];

      const cleanResults = records.map(item => ({
        // This 'Deep Mapping' checks for all common naming variations used by Vercel APIs
        number: item.mobile || item.number || item.phone || item.Mobile || mobileNumber,
        name: item.name || item.full_name || item.FullName || item["Full Name"] || "N/A",
        cnic: item.cnic || item.nic || item.CNIC || item["ID Card"] || "N/A",
        address: item.address || item.location || item.Address || "N/A",
        operator: item.operator || item.network || item.Operator || "N/A",
        developed_by: "Ramzan Ahsan"
      }));

      return new Response(
        JSON.stringify({
          success: true,
          total: cleanResults.length,
          data: cleanResults,
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
