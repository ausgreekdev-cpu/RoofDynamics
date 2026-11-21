import type { LonLat } from "./area";
import type { RoofPolygon } from "./types";

/** Escape XML special characters. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Build a KML document from measured roof planes so it can be opened in
 *  Google Earth / Google Earth Pro. Coordinates are lon,lat,alt (KML order). */
export function buildKml(opts: {
  polygons: RoofPolygon[];
  siteLocation: LonLat | null;
  pitch: number;
  roofType: "gable" | "hip_valley";
}): string {
  const { polygons, siteLocation, pitch, roofType } = opts;

  const placemarks: string[] = [];

  if (siteLocation) {
    placemarks.push(`
    <Placemark>
      <name>Measurement site</name>
      <description>GPS capture point for this measurement session.</description>
      <Point>
        <coordinates>${siteLocation.lon},${siteLocation.lat},0</coordinates>
      </Point>
    </Placemark>`);
  }

  polygons.forEach((p, i) => {
    const ring = [...p.vertices];
    if (ring.length > 0) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first.lon !== last.lon || first.lat !== last.lat) ring.push(first);
    }
    const coords = ring.map((v) => `${v.lon},${v.lat},0`).join(" ");
    placemarks.push(`
    <Placemark>
      <name>${esc(p.label || `Roof plane ${i + 1}`)}</name>
      <description>
        Plan area: ${p.planAreaSqm.toFixed(2)} m2
        True area: ${p.trueAreaSqm.toFixed(2)} m2
        Pitch: ${p.pitchDegrees} deg
        Roof type: ${roofType}
      </description>
      <Polygon>
        <extrude>0</extrude>
        <altitudeMode>clampToGround</altitudeMode>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coords}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>RoofDynamics Aerial Measurement</name>
    <description>Roof planes measured in RoofDynamics. Open in Google Earth.</description>
${placemarks.join("\n")}
  </Document>
</kml>`;
}

/** Trigger a browser download of the KML file. */
export function downloadKml(kml: string, filename = `roof-measurement-${Date.now()}.kml`): void {
  const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Google Earth web deep link for a KML file hosted at a URL. */
export function googleEarthUrl(kmlUrl: string): string {
  return `https://earth.google.com/web/search/${encodeURIComponent(kmlUrl)}`;
}
