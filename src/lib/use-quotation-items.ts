"use client";

import { useState, useMemo } from "react";
import { QuotationFormItem } from "@/types/quotation";
import { ProductItem } from "@/types/product";
import { PermintaanItem } from "@/types/permintaan";
import { parsePriceRupiah } from "@/lib/quotation-helpers";

/**
 * Hook untuk mengelola state daftar item jasa pada formulir penawaran.
 */
export function useQuotationItems(
  permintaanData: PermintaanItem | null,
  products: ProductItem[],
  onItemChange?: () => void
) {
  const [items, setItems] = useState<QuotationFormItem[]>(() => {
    if (permintaanData) {
      const matched = products.find(
        (p) =>
          p.category === "Jasa" &&
          p.status === "Aktif" &&
          (p.sku.toLowerCase() === permintaanData.serviceCode.toLowerCase() ||
            p.name.toLowerCase() === permintaanData.serviceName.toLowerCase())
      );
      const unitPrice = matched ? parsePriceRupiah(matched.price) : 0;
      const unitLabel = matched?.unit ? `per ${matched.unit.toLowerCase()}` : "per paket";
      return [
        {
          product_service_id: matched?.id || "",
          name: matched?.name || permintaanData.serviceName || "",
          description: permintaanData.title,
          unit: unitLabel,
          quantity: 1,
          unit_price: unitPrice,
          subtotal: unitPrice,
          category: "Jasa",
        },
      ];
    }
    return [];
  });

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_service_id: "",
        name: "",
        description: "",
        quantity: 1,
        unit_price: 0,
        subtotal: 0,
        unit: "per bulan",
        category: "Jasa",
      },
    ]);
    onItemChange?.();
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    onItemChange?.();
  };

  const handleProductChange = (index: number, productId: string) => {
    const selected = products.find((p) => p.id === productId);
    if (!selected) {
      setItems((prev) =>
        prev.map((item, i) =>
          i === index
            ? { ...item, product_service_id: "", name: "", unit_price: 0, subtotal: 0, unit: "per bulan" }
            : item
        )
      );
      return;
    }
    const priceNum = parsePriceRupiah(selected.price);

    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const qty = item.quantity || 1;
        return {
          ...item,
          product_service_id: selected.id,
          name: selected.name,
          unit_price: priceNum,
          subtotal: priceNum * qty,
          unit: selected.unit ? `per ${selected.unit.toLowerCase()}` : "per bulan",
          category: selected.category,
        };
      })
    );
    onItemChange?.();
  };

  const handleDescriptionChange = (index: number, description: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, description } : item))
    );
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const safeQty = Math.max(0, quantity);
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: safeQty, subtotal: item.unit_price * safeQty } : item
      )
    );
    onItemChange?.();
  };

  const subtotal = useMemo(() => items.reduce((sum, it) => sum + it.subtotal, 0), [items]);
  const totalAmount = subtotal;

  return {
    items,
    setItems,
    handleAddItem,
    handleRemoveItem,
    handleProductChange,
    handleDescriptionChange,
    handleQuantityChange,
    subtotal,
    totalAmount,
  };
}
