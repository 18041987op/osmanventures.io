"use client";
import { use } from "react";
import GastosApp from "../GastosApp";

export default function UsuarioPage({ params }: { params: Promise<{ usuario: string }> }) {
  const { usuario } = use(params);
  return <GastosApp slug={usuario} />;
}
