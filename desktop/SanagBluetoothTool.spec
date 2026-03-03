# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['server.py'],
    pathex=[],
    binaries=[],
    datas=[('F:\\PythonProject\\sanag_motion_app\\desktop/static/index.html', 'static')],
    hiddenimports=['uvicorn.logging', 'uvicorn.loops.auto', 'uvicorn.loops.asyncio', 'uvicorn.protocols.http.auto', 'uvicorn.protocols.http.h11_impl', 'uvicorn.protocols.websockets.auto', 'uvicorn.protocols.websockets.websockets_impl', 'fastapi', 'websockets', 'websockets.legacy', 'websockets.legacy.server', 'websockets.legacy.protocol', 'websockets.extensions', 'websockets.extensions.permessage_deflate', 'anyio', 'anyio._backends._trio', 'anyio._backends._asyncio', 'starlette', 'starlette.middleware', 'starlette.middleware.cors', 'starlette.middleware.errors', 'pydantic', 'pydantic.deprecated', 'winsdk', 'winsdk.windows.devices.bluetooth', 'winsdk.windows.devices.bluetooth.genericattributeprofile', 'winsdk.windows.devices.bluetooth.advertisement', 'winsdk.windows.storage.streams'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='SanagBluetoothTool',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='NONE',
)
