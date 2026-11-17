import request from "supertest";
import app from "./server";

describe("Health Check", () => {
  it("should return 200 OK", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("roofdynamics-backend");
  });
});

describe("Auth", () => {
  it("should login with valid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@perthpremier.com.au", password: "Demo1234!", tenantId: "tenant-1" });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user).toBeDefined();
    expect(response.body.tenant).toBeDefined();
    expect(response.body.tenant.name).toBe("Perth Premier Roofing & Plumbing Pty Ltd");
  });

  it("should reject login without email", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ password: "demo1234" });
    expect(response.status).toBe(400);
  });

  it("should return user info on /me with demo token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer demo-token-123")
      .set("x-tenant-id", "tenant-1");
    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.tenant).toBeDefined();
  });
});
