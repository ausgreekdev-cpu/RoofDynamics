import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Input, Textarea } from "./input";
import { Label } from "./label";
import { Checkbox } from "./checkbox";
import { Switch } from "./switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

describe("shadcn/ui primitives", () => {
  it("renders Button with variants", () => {
    render(<Button variant="secondary">Save Quote</Button>);
    expect(screen.getByText("Save Quote")).toBeInTheDocument();
  });

  it("renders Badge variants", () => {
    render(<Badge variant="success">Compliant</Badge>);
    expect(screen.getByText("Compliant")).toBeInTheDocument();
  });

  it("renders Card composition", () => {
    render(
      <Card>
        <CardHeader><CardTitle>Roof BOM</CardTitle></CardHeader>
        <CardContent>141 sheets</CardContent>
      </Card>
    );
    expect(screen.getByText("Roof BOM")).toBeInTheDocument();
    expect(screen.getByText("141 sheets")).toBeInTheDocument();
  });

  it("renders form primitives", () => {
    render(
      <>
        <Label htmlFor="suburb">Suburb</Label>
        <Input id="suburb" placeholder="Fremantle" />
        <Textarea placeholder="Notes" />
        <Checkbox aria-label="Edge protection" />
        <Switch aria-label="Mobile mode" />
      </>
    );
    expect(screen.getByPlaceholderText("Fremantle")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Notes")).toBeInTheDocument();
    expect(screen.getByLabelText("Edge protection")).toBeInTheDocument();
    expect(screen.getByLabelText("Mobile mode")).toBeInTheDocument();
  });

  it("renders Radix Tabs", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
      </Tabs>
    );
    expect(screen.getByText("Tab A")).toBeInTheDocument();
    expect(screen.getByText("Content A")).toBeInTheDocument();
  });
});
