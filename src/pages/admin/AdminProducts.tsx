import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

const categories = ["Agricultural", "Livestock", "Small Business", "Digital Services", "Transport", "Equipment"];
const emojis = ["📦", "🥔", "🫘", "🐔", "🌽", "💻", "🏍️", "🐄", "🐐", "🚜", "☕", "🍚"];

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  daily_return: number;
  total_return: number;
  image: string;
  is_active: boolean;
}

const emptyForm = { name: "", category: "Agricultural", price: "", daily_return: "", total_return: "", image: "📦" };

const AdminProducts = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  const openNew = () => { setEditId(null); setForm(emptyForm); setOpen(true); };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({ name: p.name, category: p.category, price: String(p.price), daily_return: String(p.daily_return), total_return: String(p.total_return), image: p.image });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.daily_return || !form.total_return) {
      toast({ title: "Missing fields", description: "Fill in all required fields.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      daily_return: Number(form.daily_return),
      total_return: Number(form.total_return),
      image: form.image,
    };

    if (editId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Product updated" });
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Product added" });
    }
    setSaving(false);
    setOpen(false);
    fetchProducts();
  };

  const toggleActive = async (p: Product) => {
    await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground">{products.length} products in marketplace</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Premium Coffee Beans" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select value={form.image} onValueChange={v => setForm({ ...form, image: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{emojis.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Price (RWF)</Label>
                  <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="10000" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Daily Return (RWF)</Label>
                    <Input type="number" value={form.daily_return} onChange={e => setForm({ ...form, daily_return: e.target.value })} placeholder="500" />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Return (RWF)</Label>
                    <Input type="number" value={form.total_return} onChange={e => setForm({ ...form, total_return: e.target.value })} placeholder="25000" />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editId ? "Update Product" : "Add Product"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Card key={i}><CardContent className="p-4"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
        ) : (
          <div className="space-y-3">
            {products.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No products yet. Add your first product.</p>
            ) : products.map(p => (
              <Card key={p.id} className={!p.is_active ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{p.image}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{p.name}</span>
                          <Badge variant="secondary">{p.category}</Badge>
                          {!p.is_active && <Badge variant="outline">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {Number(p.price).toLocaleString()} RWF · Daily: {Number(p.daily_return).toLocaleString()} · Total: {Number(p.total_return).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => toggleActive(p)} title={p.is_active ? "Deactivate" : "Activate"}>
                        {p.is_active ? "🟢" : "🔴"}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
