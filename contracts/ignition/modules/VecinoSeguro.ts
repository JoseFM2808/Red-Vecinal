import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Despliega los tres contratos en el orden que exigen sus dependencias:
 * ReportRegistry primero (TokenReward necesita su direccion para leer getReport()).
 *
 * "autoridad" es la tercera pata del multisig 2-de-3 de IdentityEscrow (usuario + plataforma +
 * autoridad, ver docs/PROYECTO.md). Por defecto es la misma cuenta que despliega, para que la
 * demo funcione sin configuracion — pero para un despliegue real conviene pasar una direccion
 * distinta:
 *
 *   npx hardhat ignition deploy ignition/modules/VecinoSeguro.ts \
 *     --network arbitrumSepolia \
 *     --parameters '{"VecinoSeguro":{"autoridad":"0x..."}}'
 */
export default buildModule("VecinoSeguro", (m) => {
  const deployer = m.getAccount(0);
  const autoridad = m.getParameter("autoridad", deployer);

  const reportRegistry = m.contract("ReportRegistry");
  const tokenReward = m.contract("TokenReward", [reportRegistry]);
  const identityEscrow = m.contract("IdentityEscrow", [deployer, autoridad]);

  return { reportRegistry, tokenReward, identityEscrow };
});
