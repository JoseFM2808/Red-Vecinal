// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { ReportRegistry } from "./ReportRegistry.sol";
import { TokenReward } from "./TokenReward.sol";

/// Espeja los casos de "corroboracion como prueba de presencia" y "recompensa tras
/// corroboracion posterior" de src/lib/antisybil.test.ts que no dependen de geometria
/// (radio de 300 m, que se queda del lado del cliente en esta version — ver TokenReward.sol).
contract TokenRewardTest is Test {
  ReportRegistry registry;
  TokenReward token;

  address autora = address(0xA11CE);
  address corroborador = address(0xB0B);
  address otroCorroborador = address(0xC0FFEE);

  uint256 reportId;

  function setUp() public {
    registry = new ReportRegistry();
    token = new TokenReward(address(registry));

    vm.prank(autora);
    reportId = registry.submitReport(keccak256("reporte"), -120464000, -770428000, 0, keccak256("zA"), "");
  }

  function test_SinCorroboracionLaRecompensaQuedaPendiente() public view {
    (uint256 amount, bool released) = token.pendingReward(reportId);
    assertEq(amount, 10 * 10 ** 18);
    assertFalse(released);
  }

  function test_OtroVecinoActivaElMultiplicador() public {
    vm.prank(corroborador);
    token.corroborate(reportId);

    (uint256 amount, bool released) = token.pendingReward(reportId);
    assertEq(amount, 15 * 10 ** 18);
    assertTrue(released);
  }

  function test_NoPuedesCorroborarTuPropioReporte() public {
    vm.prank(autora);
    vm.expectRevert(TokenReward.NoPuedesCorroborarTuPropioReporte.selector);
    token.corroborate(reportId);
  }

  function test_NoPuedesCorroborarDosVecesElMismoReporte() public {
    vm.prank(corroborador);
    token.corroborate(reportId);

    vm.prank(corroborador);
    vm.expectRevert(TokenReward.YaCorroboraste.selector);
    token.corroborate(reportId);
  }

  function test_UnaSegundaCorroboracionDeOtraWalletNoDuplicaElMonto() public {
    vm.prank(corroborador);
    token.corroborate(reportId);
    vm.prank(otroCorroborador);
    token.corroborate(reportId);

    (uint256 amount, ) = token.pendingReward(reportId);
    assertEq(amount, 15 * 10 ** 18);
  }

  function test_FueraDeLaVentanaDe30MinutosNoCorrobora() public {
    vm.warp(block.timestamp + 31 minutes);
    vm.prank(corroborador);
    vm.expectRevert(TokenReward.FueraDeVentanaDeCorroboracion.selector);
    token.corroborate(reportId);
  }

  function test_ClaimMinteaSoloAlAutorTrasLiberarse() public {
    vm.prank(corroborador);
    token.corroborate(reportId);

    vm.prank(autora);
    token.claim(reportId);

    assertEq(token.balanceOf(autora), 15 * 10 ** 18);
  }

  function test_ClaimRevierteSiTodaviaNoEstaLiberado() public {
    vm.prank(autora);
    vm.expectRevert(TokenReward.TodaviaNoLiberado.selector);
    token.claim(reportId);
  }

  function test_ClaimRevierteSiNoEresElAutor() public {
    vm.prank(corroborador);
    token.corroborate(reportId);

    vm.prank(corroborador);
    vm.expectRevert(TokenReward.SoloElAutorPuedeReclamar.selector);
    token.claim(reportId);
  }

  function test_ClaimRevierteSiYaReclamaste() public {
    vm.prank(corroborador);
    token.corroborate(reportId);
    vm.prank(autora);
    token.claim(reportId);

    vm.prank(autora);
    vm.expectRevert(TokenReward.YaReclamado.selector);
    token.claim(reportId);
  }
}
