// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title ReportRegistry
/// @notice Ancla el hash de un reporte vecinal (foto/video via IPFS + coordenada + categoria +
/// timestamp) sin guardar identidad real. La direccion que llama es pseudonima por diseno
/// (src/lib/identidad.ts en el frontend).
///
/// El limite de frecuencia (maxReportesPorVentana / esperaMismaZonaMs de src/lib/antisybil.ts)
/// se aplica ACA, no en TokenReward: este es el unico punto de entrada real al que puede llegar
/// cualquier wallet, con o sin pasar por la app. Sin este chequeo aqui, "la cadena revalida y
/// tiene la ultima palabra" (comentario de antisybil.ts) seria falso.
contract ReportRegistry {
  struct Report {
    bytes32 contentHash;
    address reporter;
    int32 latE6;
    int32 lngE6;
    uint8 category;
    uint64 timestamp;
    string cid;
  }

  /// @dev Especificacion: src/lib/antisybil.ts POLITICA_RECOMPENSA.
  uint256 public constant VENTANA_HORARIA = 1 hours;
  uint256 public constant MAX_REPORTES_POR_VENTANA = 3;
  uint256 public constant ESPERA_MISMA_ZONA = 15 minutes;

  uint256 public totalReports;
  mapping(uint256 => Report) private _reports;

  /// @dev Buffer circular de los ultimos MAX_REPORTES_POR_VENTANA timestamps por wallet, mas
  /// un contador de cuantas posiciones son datos reales (tope 3). El contador es necesario:
  /// no basta con "posicion en 0 = nunca reporto", porque en una red simulada de test
  /// block.timestamp puede empezar cerca de la epoca y un timestamp real temprano se
  /// confundiria con una posicion vacia.
  mapping(address => uint256[3]) private _ultimosTimestamps;
  mapping(address => uint8) private _cursorRingBuffer;
  mapping(address => uint8) private _reportesRegistrados;

  mapping(address => mapping(bytes32 => uint256)) private _ultimoEnZona;

  event ReportSubmitted(
    uint256 indexed reportId,
    address indexed reporter,
    bytes32 contentHash,
    int32 latE6,
    int32 lngE6,
    uint8 category,
    uint64 timestamp,
    string cid
  );

  error HashInvalido();
  error LimiteHorarioExcedido(uint256 proximoPermitidoEn);
  error ZonaEnEspera(uint256 proximoPermitidoEn);
  error ReporteInexistente();

  function submitReport(
    bytes32 contentHash,
    int32 latE6,
    int32 lngE6,
    uint8 category,
    bytes32 zoneId,
    string calldata cid
  ) external returns (uint256 reportId) {
    if (contentHash == bytes32(0)) revert HashInvalido();

    // Regla 1 (prioridad sobre la 2, igual que evaluarReporte en antisybil.ts): frecuencia
    // por wallet. El mas antiguo de los ultimos 3 define si el 4to reporte en la hora entra.
    // Solo se aplica si ya hizo al menos 3 reportes: antes de eso no puede haber alcanzado
    // el limite todavia.
    if (uint256(_reportesRegistrados[msg.sender]) >= MAX_REPORTES_POR_VENTANA) {
      uint256 masAntiguo = _masAntiguoDeLosUltimos(msg.sender);
      if (block.timestamp - masAntiguo < VENTANA_HORARIA) {
        revert LimiteHorarioExcedido(masAntiguo + VENTANA_HORARIA);
      }
    }

    // Regla 2: espera por zona.
    uint256 ultimoZona = _ultimoEnZona[msg.sender][zoneId];
    if (ultimoZona != 0 && block.timestamp - ultimoZona < ESPERA_MISMA_ZONA) {
      revert ZonaEnEspera(ultimoZona + ESPERA_MISMA_ZONA);
    }

    _registrarEnvio(msg.sender, zoneId);

    reportId = ++totalReports;
    _reports[reportId] = Report({
      contentHash: contentHash,
      reporter: msg.sender,
      latE6: latE6,
      lngE6: lngE6,
      category: category,
      timestamp: uint64(block.timestamp),
      cid: cid
    });

    emit ReportSubmitted(
      reportId,
      msg.sender,
      contentHash,
      latE6,
      lngE6,
      category,
      uint64(block.timestamp),
      cid
    );
  }

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
    )
  {
    if (reportId == 0 || reportId > totalReports) revert ReporteInexistente();
    Report storage r = _reports[reportId];
    return (r.contentHash, r.reporter, r.latE6, r.lngE6, r.category, r.timestamp, r.cid);
  }

  function _masAntiguoDeLosUltimos(address wallet) private view returns (uint256) {
    uint256[3] storage ts = _ultimosTimestamps[wallet];
    uint256 menor = ts[0];
    if (ts[1] < menor) menor = ts[1];
    if (ts[2] < menor) menor = ts[2];
    return menor;
  }

  function _registrarEnvio(address wallet, bytes32 zoneId) private {
    uint8 cursor = _cursorRingBuffer[wallet];
    _ultimosTimestamps[wallet][cursor] = block.timestamp;
    _cursorRingBuffer[wallet] = (cursor + 1) % 3;
    _ultimoEnZona[wallet][zoneId] = block.timestamp;

    // Tope en 3: es todo lo que _masAntiguoDeLosUltimos necesita saber, y evita que un
    // reportero muy activo desborde un uint8 despues de 255 reportes.
    if (uint256(_reportesRegistrados[wallet]) < MAX_REPORTES_POR_VENTANA) {
      _reportesRegistrados[wallet] += 1;
    }
  }
}
