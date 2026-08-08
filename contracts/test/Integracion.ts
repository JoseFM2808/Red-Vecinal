import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { keccak256, stringToHex, parseEventLogs } from "viem";

/**
 * Prueba de integracion de punta a punta: despliega los tres contratos y reproduce
 * exactamente la secuencia de llamadas que hace el frontend (src/lib/chain/arbitrum-adapter.ts
 * y src/lib/chain/eventos.ts), con la misma libreria (viem) que usa la app real. El objetivo
 * no es repetir los casos ya cubiertos en los .t.sol, sino confirmar que las firmas ABI que
 * src/lib/chain/abis.ts espera coinciden de verdad con lo que los contratos compilados exponen.
 */
describe("Flujo completo: reportar, corroborar, reclamar", async function () {
  const { viem } = await network.create();

  it("ancla un reporte, otro vecino lo corrobora, y el autor reclama VSG", async function () {
    const [autora, corroborador] = await viem.getWalletClients();

    const registry = await viem.deployContract("ReportRegistry");
    const token = await viem.deployContract("TokenReward", [registry.address]);

    // Mismo formato que arbitrum-adapter.ts: zoneId es keccak256 del string de zona.
    const zoneId = keccak256(stringToHex("z2391_-15409"));
    const contentHash = keccak256(stringToHex("reporte-de-prueba"));

    const txHash = await registry.write.submitReport(
      [contentHash, -120464000, -770428000, 0, zoneId, "bafyEvidenciaDePrueba"],
      { account: autora.account },
    );

    const publicClient = await viem.getPublicClient();
    const recibo = await publicClient.waitForTransactionReceipt({ hash: txHash });
    assert.equal(recibo.status, "success");

    const logs = parseEventLogs({ abi: registry.abi, logs: recibo.logs, eventName: "ReportSubmitted" });
    assert.equal(logs.length, 1);
    const reportId = logs[0]!.args.reportId!;
    assert.equal(logs[0]!.args.cid, "bafyEvidenciaDePrueba");

    const [pendienteAntes, liberadoAntes] = await token.read.pendingReward([reportId]);
    assert.equal(pendienteAntes, 10n * 10n ** 18n);
    assert.equal(liberadoAntes, false);

    await token.write.corroborate([reportId], { account: corroborador.account });

    const [monto, liberado] = await token.read.pendingReward([reportId]);
    assert.equal(monto, 15n * 10n ** 18n);
    assert.equal(liberado, true);

    await token.write.claim([reportId], { account: autora.account });
    const saldo = await token.read.balanceOf([autora.account.address]);
    assert.equal(saldo, 15n * 10n ** 18n);
  });
});
