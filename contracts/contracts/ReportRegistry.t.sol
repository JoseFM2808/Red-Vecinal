// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { ReportRegistry } from "./ReportRegistry.sol";

/// Espeja los casos de "limite por wallet" y "espera por zona" de src/lib/antisybil.test.ts
/// que tienen un analogo on-chain. Los que dependen de geometria (radio de corroboracion) o
/// de comparar direcciones sin distinguir mayusculas no aplican aqui: una `address` de Solidity
/// no tiene ese problema, y la corroboracion geoespacial se queda deliberadamente fuera de
/// cadena en esta version (ver el comentario en TokenReward.sol).
contract ReportRegistryTest is Test {
  ReportRegistry registry;

  address vecina = address(0xA11CE);
  address otro1 = address(0xB0B);
  address otro2 = address(0xC0FFEE);

  bytes32 constant HASH_1 = keccak256("reporte-1");
  bytes32 constant HASH_2 = keccak256("reporte-2");
  bytes32 constant HASH_3 = keccak256("reporte-3");
  bytes32 constant HASH_4 = keccak256("reporte-4");
  bytes32 constant ZONA_A = keccak256("zA");
  bytes32 constant ZONA_B = keccak256("zB");

  function setUp() public {
    registry = new ReportRegistry();
  }

  function _submit(address quien, bytes32 hash, bytes32 zona) internal returns (uint256) {
    vm.prank(quien);
    return registry.submitReport(hash, -120464000, -770428000, 0, zona, "");
  }

  function test_AceptaElPrimerReporteDeUnaWalletNueva() public {
    uint256 id = _submit(vecina, HASH_1, ZONA_A);
    assertEq(id, 1);
    assertEq(registry.totalReports(), 1);

    (bytes32 contentHash, address reporter, , , , , ) = registry.getReport(1);
    assertEq(contentHash, HASH_1);
    assertEq(reporter, vecina);
  }

  function test_RechazaElCuartoReporteDentroDeLaMismaHora() public {
    _submit(vecina, HASH_1, ZONA_A);
    vm.warp(block.timestamp + 10 minutes);
    _submit(vecina, HASH_2, ZONA_B);
    vm.warp(block.timestamp + 10 minutes);
    _submit(vecina, HASH_3, keccak256("zC"));

    vm.warp(block.timestamp + 10 minutes);
    vm.expectRevert();
    _submit(vecina, HASH_4, keccak256("zD"));
  }

  function test_VuelveAAceptarCuandoElMasAntiguoSaleDeLaVentana() public {
    _submit(vecina, HASH_1, ZONA_A);
    vm.warp(block.timestamp + 5 minutes);
    _submit(vecina, HASH_2, ZONA_B);
    vm.warp(block.timestamp + 5 minutes);
    _submit(vecina, HASH_3, keccak256("zC"));

    // El primero sale de la ventana de 1h a partir de aca.
    vm.warp(block.timestamp + 1 hours + 1);
    uint256 id = _submit(vecina, HASH_4, keccak256("zD"));
    assertEq(id, 4);
  }

  function test_NoCuentaReportesDeOtrasWalletsContraElLimitePropio() public {
    _submit(otro1, HASH_1, ZONA_A);
    _submit(otro2, HASH_2, ZONA_B);
    _submit(otro1, HASH_3, keccak256("zC"));

    uint256 id = _submit(vecina, HASH_4, keccak256("zD"));
    assertEq(id, 4);
  }

  function test_RechazaRepetirLaMismaZonaAntesDe15Minutos() public {
    _submit(vecina, HASH_1, ZONA_A);
    vm.warp(block.timestamp + 5 minutes);

    vm.expectRevert();
    _submit(vecina, HASH_2, ZONA_A);
  }

  function test_PermiteReportarEnOtraZonaSinEsperar() public {
    _submit(vecina, HASH_1, ZONA_A);
    vm.warp(block.timestamp + 1 minutes);

    uint256 id = _submit(vecina, HASH_2, ZONA_B);
    assertEq(id, 2);
  }

  function test_PermiteRepetirLaZonaPasados15Minutos() public {
    _submit(vecina, HASH_1, ZONA_A);
    vm.warp(block.timestamp + 15 minutes + 1);

    uint256 id = _submit(vecina, HASH_2, ZONA_A);
    assertEq(id, 2);
  }

  function test_ElLimiteHorarioTienePrioridadSobreElDeZona() public {
    _submit(vecina, HASH_1, ZONA_A);
    vm.warp(block.timestamp + 5 minutes);
    _submit(vecina, HASH_2, ZONA_B);
    vm.warp(block.timestamp + 5 minutes);
    // Misma zona que HASH_1 pero ya paso la espera de 15 min: si solo existiera la regla de
    // zona, esto entraria. La regla horaria (3 en la hora) debe rechazarlo igual.
    _submit(vecina, HASH_3, keccak256("zC"));

    vm.warp(block.timestamp + 2 minutes);
    vm.expectRevert(
      abi.encodeWithSelector(ReportRegistry.LimiteHorarioExcedido.selector, block.timestamp - 12 minutes + 1 hours)
    );
    _submit(vecina, HASH_4, ZONA_A);
  }

  function test_RevierteConHashVacio() public {
    vm.expectRevert(ReportRegistry.HashInvalido.selector);
    _submit(vecina, bytes32(0), ZONA_A);
  }

  function test_GetReportRevierteSiElReporteNoExiste() public {
    vm.expectRevert(ReportRegistry.ReporteInexistente.selector);
    registry.getReport(1);
  }
}
