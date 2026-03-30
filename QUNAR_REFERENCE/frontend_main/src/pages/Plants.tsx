import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { apiDelete, apiGet, apiPatch, apiPost, API_PREFIX } from "@/api/client";
import { useI18n } from "@/context/I18nContext";

const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

type Farm = { id: number; name: string };

type Plant = {
  id: number;
  plot_id: number;
  crop_type: string;
  progress: number;
  status: string;
};

type CropType = { type: string; name: string };

type Message = {
  type: "error" | "success";
  text: string;
};

const Plants = () => {
  const { t, language } = useI18n();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [cropTypes, setCropTypes] = useState<CropType[]>([]);
  const [plotId, setPlotId] = useState("");
  const [cropType, setCropType] = useState("");
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const purchaseCopy = {
    en: {
      title: "Buy a new plant",
      hint: "Select a farm and seed type. Purchase creates a new plant instantly.",
      button: "Buy & plant",
      priceLabel: "Seed price",
      priceNote: "Seeds are purchased separately from the subscription.",
    },
    ru: {
      title: "Покупка растения",
      hint: "Выберите ферму и тип семян. Покупка сразу создаёт посадку.",
      button: "Купить и посадить",
      priceLabel: "Цена семян",
      priceNote: "Семена покупаются отдельно от подписки.",
    },
    kk: {
      title: "Жаңа өсімдік сатып алу",
      hint: "Ферма мен дақылды таңдаңыз. Сатып алу бірден отырғызады.",
      button: "Сатып алып отырғызу",
      priceLabel: "Тұқым бағасы",
      priceNote: "Тұқым жазылымнан бөлек сатып алынады.",
    },
  } as const;
  const purchaseText = purchaseCopy[language] ?? purchaseCopy.en;
  const seedPrices: Record<string, string> = {
    tomato: "990 ₸",
    carrot: "790 ₸",
    potato: "690 ₸",
    lettuce: "890 ₸",
    cucumber: "990 ₸",
    pepper: "1 190 ₸",
    basil: "590 ₸",
    strawberry: "1 490 ₸",
    mint: "590 ₸",
  };
  const selectedPrice = cropType ? seedPrices[cropType] : null;

  const loadFarms = async () => {
    const { data } = await apiGet<Farm[]>(`${API_PREFIX}/farms`);
    setFarms(data || []);
  };

  const loadPlants = async () => {
    const { data } = await apiGet<Plant[]>(`${API_PREFIX}/plants`);
    setPlants(data || []);
  };

  const loadCropTypes = async () => {
    try {
      const { data } = await apiGet<{ plant_types: CropType[] }>(`${API_PREFIX}/plants/types/list`, false);
      setCropTypes(data.plant_types || []);
    } catch {
      setCropTypes([
        { type: "tomato", name: "Tomato" },
        { type: "carrot", name: "Carrot" },
        { type: "potato", name: "Potato" },
      ]);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadFarms(), loadPlants(), loadCropTypes()]);
      setMessage(null);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("plantsPage.errorLoad") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!plotId && farms.length > 0) {
      setPlotId(String(farms[0].id));
    }
  }, [farms, plotId]);

  useEffect(() => {
    if (!cropType && cropTypes.length > 0) {
      setCropType(cropTypes[0].type);
    }
  }, [cropTypes, cropType]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (!plotId) {
        setMessage({ type: "error", text: t("plantsPage.createFarmFirst") });
        setLoading(false);
        return;
      }
      await apiPost(`${API_PREFIX}/plants`, {
        plot_id: Number(plotId),
        crop_type: cropType,
      });
      setMessage({ type: "success", text: t("plantsPage.successCreate") });
      await loadPlants();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("plantsPage.errorCreate") });
    } finally {
      setLoading(false);
    }
  };

  const handleMakeReady = async (plantId: number) => {
    setLoading(true);
    setMessage(null);
    try {
      await apiPatch(`${API_PREFIX}/plants/${plantId}`, { progress: 100 });
      setMessage({ type: "success", text: t("plantsPage.successReady") });
      await loadPlants();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("plantsPage.errorUpdate") });
    } finally {
      setLoading(false);
    }
  };

  const handleHarvest = async (plantId: number) => {
    setLoading(true);
    setMessage(null);
    try {
      await apiPost(`${API_PREFIX}/plants/${plantId}/harvest`, {});
      setMessage({ type: "success", text: t("plantsPage.successHarvest") });
      await loadPlants();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("plantsPage.errorHarvest") });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (plantId: number) => {
    setLoading(true);
    setMessage(null);
    try {
      const ok = window.confirm(t("plantsPage.confirmDelete"));
      if (!ok) {
        setLoading(false);
        return;
      }
      await apiDelete(`${API_PREFIX}/plants/${plantId}`);
      setMessage({ type: "success", text: t("plantsPage.successDelete") });
      await loadPlants();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("plantsPage.errorDelete") });
    } finally {
      setLoading(false);
    }
  };

  const farmsById = useMemo(() => Object.fromEntries(farms.map((farm) => [farm.id, farm.name])), [farms]);

  const getStatusLabel = (status: string) => {
    const key = `plantsPage.status.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

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
                <select className={selectClass} value={plotId} onChange={(e) => setPlotId(e.target.value)}>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name} (ID {farm.id})
                    </option>
                  ))}
                </select>
                <select className={selectClass} value={cropType} onChange={(e) => setCropType(e.target.value)}>
                  {cropTypes.map((type) => (
                    <option key={type.type} value={type.type}>
                      {type.name} ({type.type})
                    </option>
                  ))}
                </select>
                {selectedPrice && (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-700">
                    <div className="font-semibold">
                      {purchaseText.priceLabel}: {selectedPrice}
                    </div>
                    <div className="text-xs text-emerald-700/80">{purchaseText.priceNote}</div>
                  </div>
                )}
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
                <h2 className="text-xl font-semibold">{t("plantsPage.listTitle")}</h2>
                <Button variant="outline" onClick={loadPlants} disabled={loading}>{t("common.reload")}</Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{t("plantsPage.listHint")}</p>
              {plants.length === 0 && <div className="text-sm text-muted-foreground">{t("plantsPage.noPlants")}</div>}
              {plants.length > 0 && (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2">{t("plantsPage.tableId")}</th>
                        <th>{t("plantsPage.tableType")}</th>
                        <th>{t("plantsPage.tableFarm")}</th>
                        <th>{t("plantsPage.tableProgress")}</th>
                        <th>{t("plantsPage.tableStatus")}</th>
                        <th>{t("plantsPage.tableActions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plants.map((plant) => (
                        <tr key={plant.id} className="border-t">
                          <td className="py-2">{plant.id}</td>
                          <td>{plant.crop_type}</td>
                          <td>{farmsById[plant.plot_id] || plant.plot_id}</td>
                          <td>{plant.progress}%</td>
                          <td>{getStatusLabel(plant.status)}</td>
                          <td className="flex flex-wrap gap-2 py-2">
                            <Button variant="outline" size="sm" onClick={() => handleMakeReady(plant.id)}>
                              {t("plantsPage.actionReady")}
                            </Button>
                            <Button size="sm" disabled={plant.status !== "ready"} onClick={() => handleHarvest(plant.id)}>
                              {t("plantsPage.actionHarvest")}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(plant.id)}>
                              {t("plantsPage.actionDelete")}
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

export default Plants;
