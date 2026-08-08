/**
 * ABIs esperadas por el frontend, en formato legible (compatible con `parseAbi` de viem).
 *
 * Es un contrato de interfaz con el equipo de contratos: mientras los .sol respeten
 * estas firmas, el frontend funciona sin cambios. Si una firma tiene que cambiar,
 * se avisa y se registra en src/data/decisiones.json.
 */

/** Exportado aparte (no solo dentro del arreglo) para que src/lib/chain/eventos.ts lo
 *  pueda pasar a `parseAbiItem` con el tipo literal completo, sin depender de un indice. */
export const EVENTO_REPORT_SUBMITTED =
  "event ReportSubmitted(uint256 indexed reportId, address indexed reporter, bytes32 contentHash, int32 latE6, int32 lngE6, uint8 category, uint64 timestamp, string cid)" as const;

export const ABI_REPORT_REGISTRY = [
  "function submitReport(bytes32 contentHash, int32 latE6, int32 lngE6, uint8 category, bytes32 zoneId, string cid) returns (uint256 reportId)",
  "function getReport(uint256 reportId) view returns (bytes32 contentHash, address reporter, int32 latE6, int32 lngE6, uint8 category, uint64 timestamp, string cid)",
  "function totalReports() view returns (uint256)",
  EVENTO_REPORT_SUBMITTED,
] as const;

export const ABI_TOKEN_REWARD = [
  "function balanceOf(address account) view returns (uint256)",
  "function claim(uint256 reportId)",
  "function corroborate(uint256 reportId)",
  "function pendingReward(uint256 reportId) view returns (uint256 amount, bool released)",
  "event RewardMinted(address indexed to, uint256 indexed reportId, uint256 amount, uint8 multiplierBps)",
] as const;

export const ABI_IDENTITY_ESCROW = [
  "function bindIdentity(bytes32 encryptedLinkHash)",
  "function requestDisclosure(address subject, bytes32 caseHash) returns (uint256 requestId)",
  "function approveDisclosure(uint256 requestId)",
  "function disclosureStatus(uint256 requestId) view returns (uint8 approvals, bool released)",
  "event DisclosureRequested(uint256 indexed requestId, address indexed subject, bytes32 caseHash)",
  "event DisclosureApproved(uint256 indexed requestId, address indexed guardian, uint8 approvals)",
] as const;

/** Umbral del multisig de revelacion: 2 de 3 (usuario, plataforma, autoridad). */
export const UMBRAL_REVELACION = { requeridas: 2, totales: 3 } as const;
