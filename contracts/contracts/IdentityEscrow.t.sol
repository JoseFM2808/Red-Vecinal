// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { IdentityEscrow } from "./IdentityEscrow.sol";

contract IdentityEscrowTest is Test {
  IdentityEscrow escrow;

  address plataforma = address(this);
  address autoridad = address(0xA0710AD);
  address sujeto = address(0x5E11E70);
  address tercero = address(0xBAD);

  function setUp() public {
    escrow = new IdentityEscrow(plataforma, autoridad);
  }

  function test_BindIdentityGuardaElVinculo() public {
    vm.prank(sujeto);
    escrow.bindIdentity(keccak256("vinculo-cifrado"));
    // No hay getter publico del vinculo a proposito (privacidad); solo confirmamos que
    // requestDisclosure ya no revierte por "sin vinculo".
    uint256 requestId = escrow.requestDisclosure(sujeto, keccak256("caso-1"));
    assertEq(requestId, 1);
  }

  function test_RequestDisclosureRevierteSinVinculoPrevio() public {
    vm.expectRevert(IdentityEscrow.NoHayVinculo.selector);
    escrow.requestDisclosure(sujeto, keccak256("caso-1"));
  }

  function test_DosAprobacionesLiberanLaSolicitud() public {
    vm.prank(sujeto);
    escrow.bindIdentity(keccak256("vinculo"));
    uint256 requestId = escrow.requestDisclosure(sujeto, keccak256("caso-1"));

    vm.prank(sujeto);
    escrow.approveDisclosure(requestId);
    (uint8 approvalsTrasUna, bool releasedTrasUna) = escrow.disclosureStatus(requestId);
    assertEq(approvalsTrasUna, 1);
    assertFalse(releasedTrasUna);

    vm.prank(autoridad);
    escrow.approveDisclosure(requestId);
    (uint8 approvalsTrasDos, bool releasedTrasDos) = escrow.disclosureStatus(requestId);
    assertEq(approvalsTrasDos, 2);
    assertTrue(releasedTrasDos);
  }

  function test_UnTerceroNoAutorizadoNoPuedeAprobar() public {
    vm.prank(sujeto);
    escrow.bindIdentity(keccak256("vinculo"));
    uint256 requestId = escrow.requestDisclosure(sujeto, keccak256("caso-1"));

    vm.prank(tercero);
    vm.expectRevert(IdentityEscrow.NoAutorizado.selector);
    escrow.approveDisclosure(requestId);
  }

  function test_NoSePuedeAprobarDosVecesConLaMismaWallet() public {
    vm.prank(sujeto);
    escrow.bindIdentity(keccak256("vinculo"));
    uint256 requestId = escrow.requestDisclosure(sujeto, keccak256("caso-1"));

    vm.prank(sujeto);
    escrow.approveDisclosure(requestId);

    vm.prank(sujeto);
    vm.expectRevert(IdentityEscrow.YaAprobaste.selector);
    escrow.approveDisclosure(requestId);
  }

  function test_DisclosureStatusRevierteSiLaSolicitudNoExiste() public {
    vm.expectRevert(IdentityEscrow.SolicitudInexistente.selector);
    escrow.disclosureStatus(1);
  }
}
