import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Weather service is not configured.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  let url: string;
  if (q) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${apiKey}&units=metric`;
  } else if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${apiKey}&units=metric`;
  } else {
    return NextResponse.json({ error: 'Missing q or lat/lon parameter.' }, { status: 400 });
  }

  const response = await fetch(url);
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
