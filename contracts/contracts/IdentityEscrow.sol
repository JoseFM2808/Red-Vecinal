// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title IdentityEscrow
/// @notice Guarda el vinculo CIFRADO wallet<->identidad real (nunca la identidad en claro) y
/// solo lo libera con 2 de 3 firmas: el propio sujeto, la plataforma (owner) y una autoridad
/// verificada (docs/PROYECTO.md: "consentimiento del usuario o solicitud judicial verificable").
///
/// Toda solicitud de revelacion queda escrita en cadena para siempre — no hay forma de pedir
/// una identidad en secreto. Sin circuitos ZK (fuera de alcance del MVP, declarado en el pitch).
contract IdentityEscrow is Ownable {
  uint8 public constant APROBACIONES_REQUERIDAS = 2;

  address public autoridad;

  mapping(address => bytes32) private _vinculoCifrado;

  struct Solicitud {
    address subject;
    bytes32 caseHash;
    uint8 approvals;
    bool released;
  }

  /// @dev Indice 0 se deja invalido a proposito para que requestId == 0 nunca sea una
  /// solicitud real (mismo criterio que reportId en ReportRegistry).
  Solicitud[] private _solicitudes;
  mapping(uint256 => mapping(address => bool)) private _yaAprobo;

  event IdentityBound(address indexed subject);
  event DisclosureRequested(uint256 indexed requestId, address indexed subject, bytes32 caseHash);
  event DisclosureApproved(uint256 indexed requestId, address indexed guardian, uint8 approvals);

  error NoHayVinculo();
  error SolicitudInexistente();
  error NoAutorizado();
  error YaAprobaste();
  error YaLiberado();

  constructor(address initialOwner, address autoridadInicial) Ownable(initialOwner) {
    autoridad = autoridadInicial;
    _solicitudes.push(Solicitud({ subject: address(0), caseHash: bytes32(0), approvals: 0, released: false }));
  }

  function setAutoridad(address nuevaAutoridad) external onlyOwner {
    autoridad = nuevaAutoridad;
  }

  /// @notice El propio sujeto ata su wallet a un hash cifrado del vinculo con su identidad real.
  /// El contrato nunca ve la identidad en claro, solo el hash de lo que sea que la plataforma
  /// cifro fuera de la cadena.
  function bindIdentity(bytes32 encryptedLinkHash) external {
    _vinculoCifrado[msg.sender] = encryptedLinkHash;
    emit IdentityBound(msg.sender);
  }

  function requestDisclosure(address subject, bytes32 caseHash) external returns (uint256 requestId) {
    if (_vinculoCifrado[subject] == bytes32(0)) revert NoHayVinculo();
    if (msg.sender != subject && msg.sender != owner() && msg.sender != autoridad) revert NoAutorizado();

    _solicitudes.push(Solicitud({ subject: subject, caseHash: caseHash, approvals: 0, released: false }));
    requestId = _solicitudes.length - 1;
    emit DisclosureRequested(requestId, subject, caseHash);
  }

  function approveDisclosure(uint256 requestId) external {
    if (requestId == 0 || requestId >= _solicitudes.length) revert SolicitudInexistente();
    Solicitud storage s = _solicitudes[requestId];
    if (s.released) revert YaLiberado();
    if (msg.sender != s.subject && msg.sender != owner() && msg.sender != autoridad) revert NoAutorizado();
    if (_yaAprobo[requestId][msg.sender]) revert YaAprobaste();

    _yaAprobo[requestId][msg.sender] = true;
    s.approvals += 1;
    if (s.approvals >= APROBACIONES_REQUERIDAS) {
      s.released = true;
    }
    emit DisclosureApproved(requestId, msg.sender, s.approvals);
  }

  function disclosureStatus(uint256 requestId) external view returns (uint8 approvals, bool released) {
    if (requestId == 0 || requestId >= _solicitudes.length) revert SolicitudInexistente();
    Solicitud storage s = _solicitudes[requestId];
    return (s.approvals, s.released);
  }
}
