"use client";

import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { FeatureGate } from "../components/FeatureGate";
import { useToast } from "../components/Toast";
import { DataTable, type Column } from "../components/DataTable";
import {
  Package,
  Truck,
  Plus,
  Edit3,
  Search,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  List,
} from "lucide-react";

const LOCATIONS = [
  { key: "WELSHPOOL_MAIN_YARD", label: "Welshpool Main Yard" },
  { key: "HILUX_UTE_1", label: "Hilux Ute 1" },
  { key: "ISUZU_TRUCK_2", label: "Isuzu Truck 2" },
];

interface StockItem {
  id: string;
  sku: string;
  name: string;
  location: string;
  quantityOnHand: number;
  quantityReserved: number;
  reorderPoint: number;
  unitCost: number;
  supplier: string;
}
interface Reservation { id: string; sku: string; quantity: number; location: string; status: string }
interface RFQ {
  id: string;
  supplier: string;
  supplierName?: string;
  title?: string;
  items: Array<{ sku: string; quantity: number }>;
  status: string;
  bidAmount?: number;
  leadTimeDays?: number;
}
interface PurchaseOrder { id: string; rfqId?: string; supplier: string; total: number; status: string }

export default function WMSMRP() {
  const toast = useToast();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>();

  const loadRFQs = async () => {
    try {
      const [r, po] = await Promise.all([api.getRFQs(), api.getPurchaseOrders()]);
      setRfqs(r);
      setPurchaseOrders(po);
    } catch {
      setRfqs([]);
      setPurchaseOrders([]);
    }
  };

  const handleGeneratePO = async (rfq: RFQ) => {
    try {
      const poNumber = `PO-${Date.now().toString().slice(-6)}`;
      await api.createPurchaseOrder({
        rfqId: rfq.id,
        poNumber,
        supplierName: rfq.supplierName,
        totalAmount: Number(rfq.bidAmount) || 0,
        status: "sent",
      });
      await api.updateRFQ(rfq.id, { status: "accepted" });
      toast.showToast("success", `PO ${poNumber} generated for ${rfq.supplierName}`);
      loadRFQs();
    } catch (err: unknown) {
      toast.showToast("error", (err as Error)?.message || "Failed to generate PO");
    }
  };
  const [newItem, setNewItem] = useState({
    sku: "",
    name: "",
    location: "WELSHPOOL_MAIN_YARD",
    quantityOnHand: 0,
    reorderPoint: 0,
    unitCost: 0,
    supplier: "",
  });
  const [loading, setLoading] = useState(false);

  const stockColumns: Column<StockItem>[] = [
    { key: "sku", header: "SKU", render: (r) => <span className="text-[#94A3B8]">{r.sku}</span> },
    { key: "name", header: "Item Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "location", header: "Location", render: (r) => <span className="text-[#94A3B8]">{r.location}</span> },
    { key: "quantityOnHand", header: "On Hand", render: (r) => <span className="font-medium">{r.quantityOnHand}</span>, sortValue: (r) => Number(r.quantityOnHand) },
    { key: "quantityReserved", header: "Reserved", render: (r) => <span className="text-[#94A3B8]">{r.quantityReserved}</span>, sortValue: (r) => Number(r.quantityReserved) },
    { key: "unitCost", header: "Unit Cost", render: (r) => `$${Number(r.unitCost || 0).toFixed(2)}`, sortValue: (r) => Number(r.unitCost) },
    { key: "supplier", header: "Supplier", render: (r) => <span className="text-[#94A3B8]">{r.supplier || "—"}</span> },
    {
      key: "status", header: "Status",
      render: (r) => {
        const isLow = Number(r.quantityOnHand) <= Number(r.reorderPoint);
        return <span className={`px-2 py-1 rounded-full text-xs font-bold ${isLow ? "bg-[#EF4444]/20 text-[#EF4444]" : "bg-[#10B981]/20 text-[#10B981]"}`}>{isLow ? "LOW STOCK" : "OK"}</span>;
      },
      sortValue: (r) => (Number(r.quantityOnHand) <= Number(r.reorderPoint) ? 0 : 1),
    },
    { key: "actions", header: "Actions", sortable: false, render: (r) => <button onClick={() => handleReserve(r)} className="text-[#0EA5E9] hover:underline">Reserve Stock</button> },
  ];

  useEffect(() => {
    loadData();
    loadRFQs();
  }, []);

  const loadData = async () => {
    try {
      const [items, res] = await Promise.all([
        api.getStockItems(selectedLocation),
        api.getStockReservations(),
      ]);
      setStockItems(items);
      setReservations(res);
    } catch {
      setStockItems([
        { id: "1", sku: "CB-CORR-3.0", name: "Colorbond Corrugated 3.0m", location: "WELSHPOOL_MAIN_YARD", quantityOnHand: 45, quantityReserved: 10, reorderPoint: 20, unitCost: 32, supplier: "Lysaght Welshpool" },
        { id: "2", sku: "BATT-40MM", name: "Topspan 40mm Batten", location: "HILUX_UTE_1", quantityOnHand: 120, quantityReserved: 30, reorderPoint: 50, unitCost: 8.5, supplier: "Stramit Malaga" },
        { id: "3", sku: "ANTICON-60", name: "Anticon 60mm Insulation", location: "WELSHPOOL_MAIN_YARD", quantityOnHand: 12, quantityReserved: 5, reorderPoint: 8, unitCost: 65, supplier: "Metroll Canning Vale" },
        { id: "4", sku: "SCREW-12G", name: "12g x 65mm Crest Screws", location: "ISUZU_TRUCK_2", quantityOnHand: 5000, quantityReserved: 1500, reorderPoint: 2000, unitCost: 0.65, supplier: "Stratco" },
      ]);
      setReservations([]);
    }
  };

  const syncPrices = async () => {
    try {
      const result = await api.syncSupplierPrices();
      toast.showToast("success", `Synced ${result.count} supplier prices`);
    } catch (err: unknown) {
      toast.showToast("error", (err as Error)?.message || "Price sync failed");
    }
  };

  const lowStock = stockItems.filter(
    (item) => Number(item.quantityOnHand) <= Number(item.reorderPoint)
  );

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createStockItem(newItem);
      setNewItem({ sku: "", name: "", location: "WELSHPOOL_MAIN_YARD", quantityOnHand: 0, reorderPoint: 0, unitCost: 0, supplier: "" });
      loadData();
    } catch (err: unknown) {
      toast.showToast("error", (err as Error)?.message || "Failed to create stock item");
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (item: StockItem) => {
    const qty = prompt(`Reserve quantity for ${item.name}? (on hand: ${item.quantityOnHand})`);
    if (qty === null) return;
    const q = parseFloat(qty);
    if (isNaN(q) || q <= 0) return;
    try {
      await api.createStockReservation({ jobId: "job-demo", stockItemId: item.id, quantity: q });
      loadData();
    } catch (err: unknown) {
      toast.showToast("error", (err as Error)?.message || "Failed to reserve stock");
    }
  };

  return (
    <FeatureGate moduleKey="WMS_MRP">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">WMS / MRP Manager</h1>
            <p className="text-[#94A3B8]">Warehouse & Van Inventory — Welshpool Yard, Hilux Ute 1, Isuzu Truck 2</p>
          </div>
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition"
          >
            <Plus className="w-4 h-4" />
            Add Stock Item
          </button>
        </div>

        {/* Location Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedLocation(undefined)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition ${!selectedLocation ? "bg-[#0EA5E9] text-[#0F172A]" : "bg-[#1E293B] text-[#94A3B8] border border-[#334155]"}`}
          >
            All Locations
          </button>
          {LOCATIONS.map((loc) => (
            <button
              key={loc.key}
              onClick={() => setSelectedLocation(loc.key)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${selectedLocation === loc.key ? "bg-[#0EA5E9] text-[#0F172A]" : "bg-[#1E293B] text-[#94A3B8] border border-[#334155]"}`}
            >
              {loc.label}
            </button>
          ))}
        </div>

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <div className="bg-[#7F1D1D]/20 border border-[#7F1D1D]/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[#FCA5A5]" />
              <h3 className="text-sm font-bold text-[#FCA5A5]">MRP Shortage Alert — {lowStock.length} item(s) below reorder point</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#FCA5A5]">
                    <th className="text-left py-2">SKU</th>
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Location</th>
                    <th className="text-right py-2">On Hand</th>
                    <th className="text-right py-2">Reorder Point</th>
                    <th className="text-right py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item) => (
                    <tr key={item.id} className="border-b border-[#334155]/30">
                      <td className="py-2 text-[#94A3B8]">{item.sku}</td>
                      <td className="py-2 text-[#F8FAFC]">{item.name}</td>
                      <td className="py-2 text-[#94A3B8]">{item.location}</td>
                      <td className="py-2 text-right text-[#FCA5A5]">{item.quantityOnHand}</td>
                      <td className="py-2 text-right text-[#94A3B8]">{item.reorderPoint}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleReserve(item)}
                          className="text-xs text-[#0EA5E9] hover:underline"
                        >
                          Reserve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stock Table */}
        <div className="flex justify-end mb-2">
          <button onClick={syncPrices} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg hover:bg-[#38BDF8] transition">
            <RefreshCw className="w-3.5 h-3.5" /> Sync Supplier Prices
          </button>
        </div>
        <div data-tour="stock-table">
        <DataTable
          data={stockItems}
          columns={stockColumns}
          searchFields={["sku", "name", "supplier", "location"]}
          pageSize={10}
          emptyMessage="No stock items found"
        />
        </div>

        {/* Add Stock Form */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#F8FAFC] mb-4">Add New Stock Item</h3>
          <form onSubmit={handleCreateItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-4 md:col-span-2">
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">SKU</label>
              <input
                name="sku"
                value={newItem.sku}
                onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                placeholder="e.g. CB-CORR-3.0"
              />
            </div>
            <div className="col-span-4 md:col-span-2">
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Item Name</label>
              <input
                name="name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                placeholder="e.g. Colorbond Corrugated Sheet"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Location</label>
              <select
                name="location"
                value={newItem.location}
                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc.key} value={loc.key}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Qty On Hand</label>
              <input
                type="number"
                name="quantityOnHand"
                value={newItem.quantityOnHand}
                onChange={(e) => setNewItem({ ...newItem, quantityOnHand: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Reorder Point</label>
              <input
                type="number"
                name="reorderPoint"
                value={newItem.reorderPoint}
                onChange={(e) => setNewItem({ ...newItem, reorderPoint: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Unit Cost ($)</label>
              <input
                type="number"
                name="unitCost"
                value={newItem.unitCost}
                onChange={(e) => setNewItem({ ...newItem, unitCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
              />
            </div>
            <div className="col-span-4 md:col-span-2">
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Supplier</label>
              <input
                name="supplier"
                value={newItem.supplier}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                className="w-full px-3 py-2 bg-[#0F172A] border border-[#334155] rounded-lg text-[#F8FAFC] focus:ring-2 focus:ring-[#0EA5E9]"
                placeholder="e.g. Lysaght Welshpool"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="col-span-4 md:col-span-2 py-3 bg-[#0EA5E9] text-[#0F172A] font-bold rounded-lg disabled:opacity-50 hover:bg-[#38BDF8] transition"
            >
              {loading ? "Adding..." : "Add Stock Item"}
            </button>
          </form>
        </div>

        {/* RFQ Bid Comparison & 1-Click PO */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC]">Supplier RFQ Bid Comparison</h3>
              <p className="text-xs text-[#94A3B8] mt-1">Compare bids from Perth suppliers and generate a PO with one click</p>
            </div>
            <button
              onClick={loadRFQs}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#94A3B8] border border-[#334155] rounded-lg hover:text-[#F8FAFC] transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0F172A]/50">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">RFQ / Supplier</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Bid Amount</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Lead Time</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Status</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#94A3B8]">Action</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.map((rfq) => {
                  const hasPO = purchaseOrders.some((po) => po.rfqId === rfq.id);
                  return (
                    <tr key={rfq.id} className="border-b border-[#1E293B]/30">
                      <td className="px-4 py-3 text-sm">
                        <div className="text-[#F8FAFC] font-medium">{rfq.title}</div>
                        <div className="text-xs text-[#94A3B8]">{rfq.supplierName}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#F8FAFC] font-bold">${Number(rfq.bidAmount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">{rfq.leadTimeDays ? `${rfq.leadTimeDays} days` : "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          rfq.status === "accepted" ? "bg-[#10B981]/20 text-[#10B981]" :
                          rfq.status === "quoted" ? "bg-[#0EA5E9]/20 text-[#0EA5E9]" :
                          "bg-[#64748A]/20 text-[#94A3B8]"
                        }`}>{rfq.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {hasPO || rfq.status === "accepted" ? (
                          <span className="text-xs text-[#10B981]">✓ PO Generated</span>
                        ) : (
                          <button
                            onClick={() => handleGeneratePO(rfq)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#0EA5E9] text-[#0F172A] font-bold text-xs rounded hover:bg-[#38BDF8] transition"
                          >
                            <ArrowRight className="w-3 h-3" /> Generate PO
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rfqs.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-[#64748B]">No RFQs yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}
