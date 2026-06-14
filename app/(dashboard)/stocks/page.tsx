"use client";

import { useEffect, useState } from "react";
import {
  Package,
  AlertTriangle,
  Plus,
  Minus,
  Search,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";

// ── Types ──────────────────────────────────────────────────────────────────

interface StockItem {
  id: number;
  ingrediente: string;
  unidad: string;
  cantidadDisponible: number;
  stockMinimo: number;
  ingredienteId?: number;
}

interface Ingrediente {
  id: number;
  nombre: string;
  unidadbase: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Component ──────────────────────────────────────────────────────────────

export default function StocksPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit state
  const [pendingStock, setPendingStock] = useState<Record<number, number>>({});
  const [editingStock, setEditingStock] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingStock, setSavingStock] = useState<number | null>(null);

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStock, setNewStock] = useState({
    idIngrediente: "",
    cantidaddisponible: "",
    stockMinimo: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  // ── Load data ────────────────────────────────────────────────────────────

  useEffect(() => {
    const loadStock = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/stock`, {
          headers: authHeaders(),
        });
        if (!res.ok) {
          if (res.status === 404) {
            setStock([]);
            return;
          }
          throw new Error("Failed to load stock");
        }
        const data = (await res.json()) as Array<{
          id?: number;
          ingrediente?: string;
          unidad?: string;
          cantidadDisponible?: number;
          stockMinimo?: number;
        }>;
        setStock(
          data.map((item, i) => ({
            id: item.id ?? i,
            ingrediente: item.ingrediente ?? "",
            unidad: item.unidad ?? "",
            cantidadDisponible: item.cantidadDisponible ?? 0,
            stockMinimo: item.stockMinimo ?? 0,
          })),
        );
      } catch {
        setError("Could not load stock. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    const loadIngredientes = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ingrediente`, {
          headers: authHeaders(),
        });
        if (!res.ok) return;
        const data = (await res.json()) as Array<{
          id?: number;
          nombre?: string;
          unidadbase?: string;
        }>;
        setIngredientes(
          data
            .filter((i) => i?.nombre)
            .map((i) => ({
              id: i.id ?? 0,
              nombre: i.nombre!,
              unidadbase: i.unidadbase ?? "",
            })),
        );
      } catch {
        // ignore
      }
    };

    loadStock();
    loadIngredientes();
  }, []);

  // ── Filtered stock ───────────────────────────────────────────────────────

  const filtered = stock.filter((item) =>
    item.ingrediente.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const lowStockItems = stock.filter((item) => {
    const qty = pendingStock[item.id] ?? item.cantidadDisponible;
    return qty <= item.stockMinimo;
  });

  // ── Stock handlers ───────────────────────────────────────────────────────

  const handleChangeQty = (item: StockItem, delta: number) => {
    const current = pendingStock[item.id] ?? item.cantidadDisponible;
    setPendingStock((prev) => ({
      ...prev,
      [item.id]: Math.max(0, current + delta),
    }));
  };

  const handleSetQuantity = (item: StockItem) => {
    const value = parseFloat(editValue);
    if (!isNaN(value) && value >= 0) {
      setPendingStock((prev) => ({ ...prev, [item.id]: value }));
    }
    setEditingStock(null);
    setEditValue("");
  };

  const handleSaveStock = async (item: StockItem) => {
    const newQty = pendingStock[item.id];
    if (newQty === undefined) return;

    setSavingStock(item.id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/stock/${item.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          idIngrediente: item.id,
          cantidaddisponible: newQty,
          stockMinimo: item.stockMinimo,
        }),
      });
      if (!res.ok) throw new Error("Failed to update stock");

      setStock((prev) =>
        prev.map((s) =>
          s.id === item.id ? { ...s, cantidadDisponible: newQty } : s,
        ),
      );
      setPendingStock((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      showSuccess("Stock updated successfully!");
    } catch {
      setError("Could not update stock. Please try again.");
    } finally {
      setSavingStock(null);
    }
  };

  const startEditing = (item: StockItem) => {
    setEditingStock(item.id);
    setEditValue(item.cantidadDisponible.toString());
  };

  // ── Create stock ─────────────────────────────────────────────────────────

  const handleCreate = async () => {
    const ingredienteId = parseInt(newStock.idIngrediente);
    console.log("ingredienteId:", ingredienteId);
    console.log("newStock:", newStock);
    if (!ingredienteId || isNaN(ingredienteId) || !newStock.cantidaddisponible){
      console.log("Validación falló")
      return;
    }
    
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/stock`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          idIngrediente: ingredienteId,
          cantidaddisponible: Number(newStock.cantidaddisponible),
          stockMinimo: Number(newStock.stockMinimo) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to create stock");
      const created = (await res.json()) as {
        id?: number;
        ingrediente?: string;
        unidad?: string;
        cantidadDisponible?: number;
        stockMinimo?: number;
      };
      setStock((prev) => [
        ...prev,
        {
          id: created.id ?? Date.now(),
          ingrediente: created.ingrediente ?? "",
          unidad: created.unidad ?? "",
          cantidadDisponible: created.cantidadDisponible ?? 0,
          stockMinimo: created.stockMinimo ?? 0,
        },
      ]);
      setNewStock({
        idIngrediente: "",
        cantidaddisponible: "",
        stockMinimo: "",
      });
      setShowCreateForm(false);
      showSuccess("Stock created successfully!");
    } catch {
      setError("Could not create stock. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // ── Available ingredients (not already in stock) ──────────────────────────

  const stockIngredienteNames = new Set(
    stock.map((s) => s.ingrediente.toLowerCase()),
  );
  const availableIngredientes = ingredientes.filter(
    (i) => !stockIngredienteNames.has(i.nombre.toLowerCase()),
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-base font-semibold leading-tight">Stock</h1>
            <p className="text-xs text-muted-foreground">
              {stock.length} ingredients tracked
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 gap-1.5 px-3 text-xs"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="size-3.5" />
          <span>Add Stock</span>
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-3">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Feedback */}
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-md border border-green-500/50 bg-green-500/10 px-3 py-2 text-xs text-green-600">
              {successMsg}
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="border-border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total items</p>
                <p className="text-2xl font-bold">{stock.length}</p>
              </CardContent>
            </Card>
            <Card
              className={`border-border ${lowStockItems.length > 0 ? "border-destructive/50 bg-destructive/5" : ""}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5">
                  {lowStockItems.length > 0 && (
                    <AlertTriangle className="size-3.5 text-destructive" />
                  )}
                  <p className="text-xs text-muted-foreground">Low stock</p>
                </div>
                <p
                  className={`text-2xl font-bold ${lowStockItems.length > 0 ? "text-destructive" : ""}`}
                >
                  {lowStockItems.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Create form */}
          {showCreateForm && (
            <Card className="border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
                <CardTitle className="text-sm font-semibold">
                  Add Stock
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewStock({
                      idIngrediente: "",
                      cantidaddisponible: "",
                      stockMinimo: "",
                    });
                  }}
                >
                  <X className="size-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 p-3 pt-0">
                <div className="space-y-1.5">
                  <Label className="text-xs">Ingredient *</Label>
                  <select
                    value={newStock.idIngrediente}
                    onChange={(e) =>
                      setNewStock({
                        ...newStock,
                        idIngrediente: e.target.value,
                      })
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select an ingredient</option>
                    {availableIngredientes.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre} ({i.unidadbase})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Available quantity *</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 500"
                      value={newStock.cantidaddisponible}
                      onChange={(e) =>
                        setNewStock({
                          ...newStock,
                          cantidaddisponible: e.target.value,
                        })
                      }
                      className="h-10"
                      min={0}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Minimum stock</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 100"
                      value={newStock.stockMinimo}
                      onChange={(e) =>
                        setNewStock({
                          ...newStock,
                          stockMinimo: e.target.value,
                        })
                      }
                      className="h-10"
                      min={0}
                    />
                  </div>
                </div>
                <Button
                  className="h-10 w-full gap-2"
                  onClick={handleCreate}
                  disabled={
                    isCreating ||
                    !parseInt(newStock.idIngrediente) ||
                    !newStock.cantidaddisponible
                  }
                >
                  <Check className="size-4" />
                  {isCreating ? "Saving..." : "Save Stock"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9"
            />
          </div>

          {/* Stock list */}
          {isLoading && (
            <Card className="border-border">
              <CardContent className="flex items-center justify-center p-8">
                <p className="text-xs text-muted-foreground">
                  Loading stock...
                </p>
              </CardContent>
            </Card>
          )}

          {!isLoading && filtered.length === 0 && (
            <Card className="border-border">
              <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <Package className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {searchQuery
                      ? "No results found"
                      : "No stock registered yet"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {searchQuery
                      ? "Try a different search term"
                      : "Add your first ingredient stock above."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {filtered.map((item) => {
              const displayQty =
                pendingStock[item.id] ?? item.cantidadDisponible;
              const isLow = displayQty <= item.stockMinimo;
              const isEditing = editingStock === item.id;
              const isDirty = pendingStock[item.id] !== undefined;
              const isSaving = savingStock === item.id;
              const progressPct =
                item.stockMinimo > 0
                  ? Math.min((displayQty / (item.stockMinimo * 3)) * 100, 100)
                  : 100;

              return (
                <Card
                  key={item.id}
                  className={`border-border ${isLow ? "border-destructive/50 bg-destructive/5" : ""}`}
                >
                  <CardContent className="p-3">
                    {/* Name + alert */}
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate text-sm font-medium">
                          {item.ingrediente}
                        </span>
                        {isLow && (
                          <div className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5">
                            <AlertTriangle className="size-3 text-destructive" />
                            <span className="text-[10px] font-medium text-destructive">
                              Low
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        Min: {item.stockMinimo} {item.unidad}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <Progress
                      value={progressPct}
                      className={`mb-3 h-1.5 ${isLow ? "[&>div]:bg-destructive" : ""}`}
                    />

                    {/* Controls */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() => handleChangeQty(item, -10)}
                        >
                          <Minus className="size-3" />
                        </Button>

                        {isEditing ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSetQuantity(item)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSetQuantity(item);
                              if (e.key === "Escape") {
                                setEditingStock(null);
                                setEditValue("");
                              }
                            }}
                            className="h-8 w-20 text-center text-sm"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => startEditing(item)}
                            className="flex h-8 min-w-[72px] items-center justify-center rounded-md bg-secondary px-2 text-sm font-semibold active:bg-accent"
                          >
                            {displayQty}
                            <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                              {item.unidad}
                            </span>
                          </button>
                        )}

                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() => handleChangeQty(item, 10)}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>

                      {isDirty && (
                        <Button
                          size="sm"
                          className="h-8 gap-1.5 px-3 text-xs"
                          onClick={() => handleSaveStock(item)}
                          disabled={isSaving}
                        >
                          <Check className="size-3" />
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
