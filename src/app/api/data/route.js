import axios from "axios";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const deviceId = searchParams.get("deviceId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = searchParams.get("page") || 1;
  const limit = searchParams.get("limit") || 10;

  try {
    const response = await axios.get("http://192.168.1.34:5000/data", {
      params: { type, deviceId, startDate, endDate, page, limit },
    });
    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
