import { describe, it, expect } from "vitest";
import { buildKml } from "./kml";
import type { RoofPolygon } from "./types";
import type { LonLat } from "./area";

const poly: RoofPolygon = {
  id: "p1",
  label: "Roof plane 1",
  vertices: [
    { lon: 115.8575, lat: -31.9523 },
    { lon: 115.8576, lat: -31.9523 },
    { lon: 115.8576, lat: -31.9524 },
  ],
  pitchDegrees: 22,
  planAreaSqm: 12.5,
  trueAreaSqm: 14.2,
};

describe("buildKml", () => {
  it("emits a valid KML document with the polygon closed", () => {
    const kml = buildKml({ polygons: [poly], siteLocation: null, pitch: 22, roofType: "gable" });
    expect(kml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(kml).toContain("<kml");
    expect(kml).toContain("<Polygon>");
    // first vertex repeated at the end to close the ring
    expect(kml).toMatch(/115\.8575,-31\.9523,0 115\.8576,-31\.9523,0 115\.8576,-31\.9524,0 115\.8575,-31\.9523,0/);
    expect(kml).toContain("Plan area: 12.50 m2");
  });

  it("includes a site point when a GPS location is provided", () => {
    const site: LonLat = { lon: 115.86, lat: -31.95 };
    const kml = buildKml({ polygons: [], siteLocation: site, pitch: 22, roofType: "gable" });
    expect(kml).toContain("<Point>");
    expect(kml).toContain("115.86,-31.95,0");
  });

  it("escapes XML special characters in labels", () => {
    const p = { ...poly, label: "Plane <1> & \"test\"" };
    const kml = buildKml({ polygons: [p], siteLocation: null, pitch: 22, roofType: "gable" });
    expect(kml).toContain("Plane &lt;1&gt; &amp; &quot;test&quot;");
  });

  it("returns a document with no placemarks for empty input", () => {
    const kml = buildKml({ polygons: [], siteLocation: null, pitch: 22, roofType: "gable" });
    expect(kml).toContain("<Document>");
    expect(kml).not.toContain("<Placemark>");
  });
});
