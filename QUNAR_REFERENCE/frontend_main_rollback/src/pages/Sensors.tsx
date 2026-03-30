import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiGet, apiPost, API_PREFIX } from "@/api/client";
import { useI18n } from "@/context/I18nContext";

const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

type Farm = { id: number; name: string };

type Sensor = {
  id: number;
  plot_id: number;
  sensor_type: string;
  name?: string | null;
};

type SensorType = { type: string; name: string; unit: string };

type Message = {
  type: "error" | "success";
  text: string;
};

const Sensors = () => {
  const { t } = useI18n();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorTypes, setSensorTypes] = useState<SensorType[]>([]);
  const [plotId, setPlotId] = useState("");
  const [sensorType, setSensorType] = useState("");
  const [sensorName, setSensorName] = useState("");
  const [message, setMessage] = useState<Message | null>(null);
  const [dataSensorId, setDataSensorId] = useState("");
  const [dataValue, setDataValue] = useState("");
  const [dataUnit, setDataUnit] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadFarms = async () => {
    const { data } = await apiGet<Farm[]>(`${API_PREFIX}/farms`);
    setFarms(data || []);
  };

  const loadSensors = async () => {
    const { data } = await apiGet<Sensor[]>(`${API_PREFIX}/sensors`);
    setSensors(data || []);
  };

  const loadSensorTypes = async () => {
    try {
      const { data } = await apiGet<{ sensor_types: SensorType[] }>(`${API_PREFIX}/sensors/types/list`, false);
      setSensorTypes(data.sensor_types || []);
    } catch {
      setSensorTypes([
        { type: "humidity", name: "Humidity", unit: "%" },
        { type: "temperature", name: "Temperature", unit: "C" },
      ]);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadFarms(), loadSensors(), loadSensorTypes()]);
      setMessage(null);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("sensorsPage.errorLoad") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!plotId && farms.length > 0) setPlotId(String(farms[0].id));
  }, [farms, plotId]);

  useEffect(() => {
    if (!sensorType && sensorTypes.length > 0) {
      setSensorType(sensorTypes[0].type);
      setDataUnit(sensorTypes[0].unit);
    }
  }, [sensorTypes, sensorType]);

  useEffect(() => {
    if (!dataSensorId && sensors.length > 0) setDataSensorId(String(sensors[0].id));
  }, [sensors, dataSensorId]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      loadSensors();
    }, 10000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (!plotId) {
        setMessage({ type: "error", text: t("sensorsPage.createFarmFirst") });
        setLoading(false);
        return;
      }
      await apiPost(`${API_PREFIX}/sensors`, {
        plot_id: Number(plotId),
        sensor_type: sensorType,
        name: sensorName || null,
      });
      setMessage({ type: "success", text: t("sensorsPage.successCreate") });
      await loadSensors();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("sensorsPage.errorCreate") });
    } finally {
      setLoading(false);
    }
  };

  const handleSendData = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (!dataSensorId) {
        setMessage({ type: "error", text: t("sensorsPage.createSensorFirst") });
        setLoading(false);
        return;
      }
      await apiPost(`${API_PREFIX}/sensors/${dataSensorId}/data`, {
        value: Number(dataValue),
        unit: dataUnit || "%",
      });
      setMessage({ type: "success", text: t("sensorsPage.successSend") });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || t("sensorsPage.errorSend") });
    } finally {
      setLoading(false);
    }
  };

  const farmsById = useMemo(() => Object.fromEntries(farms.map((farm) => [farm.id, farm.name])), [farms]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <div className="container py-8 space-y-8">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-card shadow-card">
              <h2 className="text-xl font-semibold mb-4">{t("sensorsPage.createTitle")}</h2>
              <p className="text-xs text-muted-foreground mb-3">{t("sensorsPage.createHint")}</p>
              <form className="space-y-3" onSubmit={handleCreate}>
                <select className={selectClass} value={plotId} onChange={(e) => setPlotId(e.target.value)}>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name} (ID {farm.id})
                    </option>
                  ))}
                </select>
                <select className={selectClass} value={sensorType} onChange={(e) => setSensorType(e.target.value)}>
                  {sensorTypes.map((type) => (
                    <option key={type.type} value={type.type}>
                      {type.name} ({type.type})
                    </option>
                  ))}
                </select>
                <Input placeholder={t("sensorsPage.namePlaceholder")} value={sensorName} onChange={(e) => setSensorName(e.target.value)} />
                <Button type="submit" disabled={loading}>{t("sensorsPage.createButton")}</Button>
              </form>
              {message && (
                <div className={`mt-3 text-sm ${message.type === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                  {message.text}
                </div>
              )}
            </div>

            <div className="p-6 rounded-xl bg-card shadow-card">
              <h2 className="text-xl font-semibold mb-4">{t("sensorsPage.sendTitle")}</h2>
              <p className="text-xs text-muted-foreground mb-3">{t("sensorsPage.sendHint")}</p>
              <form className="space-y-3" onSubmit={handleSendData}>
                <select className={selectClass} value={dataSensorId} onChange={(e) => setDataSensorId(e.target.value)}>
                  {sensors.map((sensor) => (
                    <option key={sensor.id} value={sensor.id}>
                      {sensor.name || sensor.sensor_type} (ID {sensor.id})
                    </option>
                  ))}
                </select>
                <Input placeholder={t("sensorsPage.valuePlaceholder")} value={dataValue} onChange={(e) => setDataValue(e.target.value)} />
                <Input placeholder={t("sensorsPage.unitPlaceholder")} value={dataUnit} onChange={(e) => setDataUnit(e.target.value)} />
                <Button type="submit" disabled={loading}>{t("sensorsPage.sendButton")}</Button>
              </form>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-card shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t("sensorsPage.listTitle")}</h2>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={loadSensors} disabled={loading}>{t("common.reload")}</Button>
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                  {t("sensorsPage.autoRefresh")}
                </label>
              </div>
            </div>
            {sensors.length === 0 && <div className="text-sm text-muted-foreground">{t("sensorsPage.noSensors")}</div>}
            {sensors.length > 0 && (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2">{t("sensorsPage.tableId")}</th>
                      <th>{t("sensorsPage.tableName")}</th>
                      <th>{t("sensorsPage.tableType")}</th>
                      <th>{t("sensorsPage.tableFarm")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensors.map((sensor) => (
                      <tr key={sensor.id} className="border-t">
                        <td className="py-2">{sensor.id}</td>
                        <td>{sensor.name || "-"}</td>
                        <td>{sensor.sensor_type}</td>
                        <td>{farmsById[sensor.plot_id] || sensor.plot_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Sensors;
