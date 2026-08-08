// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Solo la lectura que TokenReward necesita de ReportRegistry, para no duplicar storage.
interface IReportRegistryView {
  function getReport(
    uint256 reportId
  )
    external
    view
    returns (
      bytes32 contentHash,
      address reporter,
      int32 latE6,
      int32 lngE6,
      uint8 category,
      uint64 timestamp,
      string memory cid
    );
}

/// @title TokenReward
/// @notice Token ERC-20 "Vecino Seguro" (VSG, 18 decimales) y logica de recompensa.
///
/// Especificacion: src/lib/antisybil.ts. El modelo es conservador (ADR-014): un reporte que
/// nunca se corrobora nunca paga nada, ni la base. Patron pull en dos pasos, siguiendo el ABI
/// ya cerrado en src/lib/chain/abis.ts (corroborate y claim son funciones distintas):
///   1. corroborate(reportId) — cualquier wallet distinta del autor, dentro de los 30 min
///      posteriores al reporte, fija el monto final (no mintea nada todavia).
///   2. claim(reportId) — solo el autor, solo una vez, solo si ya esta liberado: es quien
///      de verdad emite el ERC-20 y dispara RewardMinted.
///
/// Limite declarado (no oculto): corroborate() no repite el chequeo de radio de 300 m que si
/// hace el cliente (buscarCorroboraciones en antisybil.ts), porque el ABI no le pasa coordenadas
/// del corroborador. Es una senal solo del cliente en esta version — igual que el resto del
/// anti-Sybil del MVP, que el propio proyecto ya declara basico.
contract TokenReward is ERC20 {
  IReportRegistryView public immutable reportRegistry;

  /// @dev src/lib/antisybil.ts POLITICA_RECOMPENSA.recompensaBase = 10 VSG.
  uint256 public constant RECOMPENSA_BASE = 10 * 10 ** 18;
  /// @dev multiplicadorCorroborado = 1.5x, representado x100 porque el evento RewardMinted
  /// lo tipa `uint8` (no entran basis points reales de 1/10000 en 8 bits).
  uint8 public constant MULTIPLICADOR_CORROBORADO_X100 = 150;
  /// @dev ventanaCorroboracionMs = 30 min.
  uint256 public constant VENTANA_CORROBORACION = 30 minutes;

  struct Estado {
    uint256 monto;
    bool liberado;
    bool reclamado;
    uint8 corroboraciones;
  }

  mapping(uint256 => Estado) private _estado;
  mapping(uint256 => mapping(address => bool)) private _yaCorroboro;

  event RewardMinted(address indexed to, uint256 indexed reportId, uint256 amount, uint8 multiplierBps);

  error NoPuedesCorroborarTuPropioReporte();
  error YaCorroboraste();
  error FueraDeVentanaDeCorroboracion();
  error TodaviaNoLiberado();
  error SoloElAutorPuedeReclamar();
  error YaReclamado();

  constructor(address reportRegistryAddress) ERC20("Vecino Seguro", "VSG") {
    reportRegistry = IReportRegistryView(reportRegistryAddress);
  }

  /// @notice Monto y estado de la recompensa de un reporte. Antes de la primera corroboracion
  /// devuelve la base como pendiente — asi el frontend puede mostrar "10 VSG pendiente" sin
  /// que exista todavia ninguna escritura en _estado (igual que construirRecompensa(0) en TS).
  function pendingReward(uint256 reportId) external view returns (uint256 amount, bool released) {
    reportRegistry.getReport(reportId); // revierte si el reporte no existe
    Estado storage e = _estado[reportId];
    if (e.liberado) return (e.monto, true);
    return (RECOMPENSA_BASE, false);
  }

  function corroborate(uint256 reportId) external {
    (, address reporter, , , , uint64 timestamp, ) = reportRegistry.getReport(reportId);

    if (msg.sender == reporter) revert NoPuedesCorroborarTuPropioReporte();
    if (_yaCorroboro[reportId][msg.sender]) revert YaCorroboraste();
    if (block.timestamp > uint256(timestamp) + VENTANA_CORROBORACION) {
      revert FueraDeVentanaDeCorroboracion();
    }

    _yaCorroboro[reportId][msg.sender] = true;
    Estado storage e = _estado[reportId];
    e.corroboraciones += 1;

    // Solo la primera corroboracion fija el monto (construirRecompensa: corroborado = > 0,
    // el multiplicador no escala con mas corroboraciones).
    if (!e.liberado) {
      e.monto = (RECOMPENSA_BASE * MULTIPLICADOR_CORROBORADO_X100) / 100;
      e.liberado = true;
    }
  }

  function claim(uint256 reportId) external {
    (, address reporter, , , , , ) = reportRegistry.getReport(reportId);
    if (msg.sender != reporter) revert SoloElAutorPuedeReclamar();

    Estado storage e = _estado[reportId];
    if (!e.liberado) revert TodaviaNoLiberado();
    if (e.reclamado) revert YaReclamado();

    e.reclamado = true;
    _mint(reporter, e.monto);
    emit RewardMinted(reporter, reportId, e.monto, MULTIPLICADOR_CORROBORADO_X100);
  }
}
