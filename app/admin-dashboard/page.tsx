"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck, FileText, Settings } from "lucide-react";

type Log = { id: number; message: string; timestamp: string };
type Sensor = { id: number; name: string; value: string };

export default function AdminDashboard() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);

  // Mock data – replace with real API calls later
  useEffect(() => {
    setLogs([
      { id: 1, message: "Experiment A completed", timestamp: "2026-03-25 10:12" },
      { id: 2, message: "Model B training started", timestamp: "2026-03-25 11:45" },
    ]);
    setSensors([
      { id: 1, name: "Temperature", value: "22 °C" },
      { id: 2, name: "Humidity", value: "45 %" },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <nav className="flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold gradient-text">ReviewAI Admin</span>
        </Link>
      </nav>

      {/* Dashboard cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Experiment Logs */}
        <section className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5" />
            Experiment Logs
          </h2>
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="text-sm">
                <span className="font-medium">{log.timestamp}:</span> {log.message}
              </li>
            ))}
          </ul>
        </section>

        {/* Sensor Settings */}
        <section className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5" />
            Sensor Data Settings
          </h2>
          <table className="w-full text-left text-sm border-collapse">
            <thead className="border-b border-white/10">
              <tr>
                <th className="pb-2">Sensor</th>
                <th className="pb-2">Current Value</th>
              </tr>
            </thead>
            <tbody>
              {sensors.map((s) => (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="py-2">{s.name}</td>
                  <td className="py-2">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
