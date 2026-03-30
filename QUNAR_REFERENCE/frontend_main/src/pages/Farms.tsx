import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiDelete, apiGet, apiPost, API_PREFIX } from "@/api/client";
import { useI18n } from "@/context/I18nContext";

type Farm = {
  id: number;
  name: string;
  size: number;
};

type Message = {
  type: "error" | "success";
  text: string;
};

const Farms = () => {
  const { t, language } = useI18n();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [locationX, setLocationX] = useState("");
  const [locationY, setLocationY] = useState("");
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const purchaseCopy = {
    en: {
      title: "Buy a new farm",
      hint: "Choose a farm package. Purchase creates the farm instantly.",
      button: "Buy & create",
      priceLabel: "Farm price",
      priceNote: "Monthly rental cost.",
    },
    ru: {
      title: "Покупка фермы",
      hint: "Выберите пакет фермы. Покупка сразу создаёт ферму.",
      button: "Купить и создать",
      priceLabel: "Цена фермы",
      priceNote: "Стоимость аренды в месяц.",
    },
    kk: {
      title: "Ферма сатып алу",
      hint: "Ферма пакетін таңдаңыз. Сатып алу бірден ферма ашады.",
      button: "Сатып алып құру",
      priceLabel: "Ферма бағасы",
      priceNote: "Ай сайынғы аренда құны.",
    },
  } as const;
  const purchaseText = purchaseCopy[language] ?? purchaseCopy.en;

  const farmTemplates = useMemo(
    () => [
      {
        id: "starter",
        label: t("farmsPage.templates.starter"),
        size: 5,
        defaultName: t("farmsPage.templates.starterName"),
      },
      {
        id: "family",
        label: t("farmsPage.templates.family"),
        size: 10,
        defaultName: t("farmsPage.templates.familyName"),
      },
      {
        id: "pro",
        label: t("farmsPage.templates.pro"),
        size: 20,
        defaultName: t("farmsPage.templates.proName"),
      },
      {
        id: "enterprise",
        label: t("farmsPage.templates.enterprise"),
        size: 50,
        defaultName: t("farmsPage.templates.enterpriseName"),
      },
    ],
    [t],
  );

  const template = useMemo(() => farmTemplates.find((item) => item.id === templateId), [templateId, farmTemplates]);
  const templatePrices: Record<string, string> = {
    starter: "4 990 ₸",
    family: "9 990 ₸",
    pro: "19 990 ₸",
    enterprise: "39 990 ₸",
  };
  const templatePrice = templateId ? templatePrices[templateId] : null;

  const loadFarms = async () => {
    setLoading(true);
    try {
      const { data } = await apiGet<Farm[]>(`${API_PREFIX}/farms`);
      setFarms(data || []);
      setMessage(null);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("farmsPage.errorLoad") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (template) {
      if (!name) setName(template.defaultName);
      if (!size) setSize(String(template.size));
    }
  }, [template, name, size]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const finalSize = Number(size || template?.size || 0);
      if (!finalSize) {
        setMessage({ type: "error", text: t("farmsPage.sizeRequired") });
        setLoading(false);
        return;
      }
      const payload: any = {
        name: name || template?.defaultName || t("farmsPage.defaultName"),
        size: finalSize,
      };
      if (locationX && locationY) {
        payload.location = { x: Number(locationX), y: Number(locationY) };
      }
      await apiPost(`${API_PREFIX}/farms`, payload);
      setMessage({ type: "success", text: t("farmsPage.successCreate") });
      await loadFarms();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("farmsPage.errorCreate") });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    setMessage(null);
    try {
      await apiDelete(`${API_PREFIX}/farms/${id}`);
      setMessage({ type: "success", text: t("farmsPage.successDelete") });
      await loadFarms();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("farmsPage.errorDelete") });
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <div className="container py-8 space-y-8">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-card shadow-card">
              <h2 className="text-xl font-semibold mb-4">{purchaseText.title}</h2>
              <p className="text-xs text-muted-foreground mb-3">{purchaseText.hint}</p>
              <form className="space-y-3" onSubmit={handleCreate}>
                <select className={selectClass} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  <option value="">{t("farmsPage.selectType")}</option>
                  {farmTemplates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {templatePrice && (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-700">
                    <div className="font-semibold">
                      {purchaseText.priceLabel}: {templatePrice}
                    </div>
                    <div className="text-xs text-emerald-700/80">{purchaseText.priceNote}</div>
                  </div>
                )}
                <Input placeholder={t("farmsPage.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
                <Input placeholder={t("farmsPage.sizePlaceholder")} value={size} onChange={(e) => setSize(e.target.value)} />
                <Input
                  placeholder={t("farmsPage.locationX")}
                  value={locationX}
                  inputMode="decimal"
                  onChange={(e) => setLocationX(e.target.value.replace(/[^\d.\-]/g, ""))}
                />
                <Input
                  placeholder={t("farmsPage.locationY")}
                  value={locationY}
                  inputMode="decimal"
                  onChange={(e) => setLocationY(e.target.value.replace(/[^\d.\-]/g, ""))}
                />
                <Button type="submit" disabled={loading}>{purchaseText.button}</Button>
              </form>
              {message && (
                <div className={`mt-3 text-sm ${message.type === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                  {message.text}
                </div>
              )}
            </div>

            <div className="p-6 rounded-xl bg-card shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t("farmsPage.listTitle")}</h2>
                <Button variant="outline" onClick={loadFarms} disabled={loading}>{t("common.reload")}</Button>
              </div>
              {farms.length === 0 && <div className="text-sm text-muted-foreground">{t("farmsPage.noFarms")}</div>}
              {farms.length > 0 && (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2">{t("farmsPage.tableId")}</th>
                        <th>{t("farmsPage.tableName")}</th>
                        <th>{t("farmsPage.tableSize")}</th>
                        <th>{t("farmsPage.tableAction")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farms.map((farm) => (
                        <tr key={farm.id} className="border-t">
                          <td className="py-2">{farm.id}</td>
                          <td>{farm.name}</td>
                          <td>{farm.size}</td>
                          <td>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(farm.id)}>
                              {t("farmsPage.delete")}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Farms;
