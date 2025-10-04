$filePath = "c:\Users\Ingram\Documents\Mythica Machina Module Development\map-shine-development\map-shine\scripts\module.js"
$content = Get-Content $filePath -Raw

$searchPattern = @"
        case "create-particle-effect-area": {
          const effectKey = target.dataset.effectKey;
          if (effectKey) {
            this._createParticleEffectArea(effectKey);
          }
          break;
        }
      }
"@

$replacement = @"
        case "create-particle-effect-area": {
          const effectKey = target.dataset.effectKey;
          if (effectKey) {
            this._createParticleEffectArea(effectKey);
          }
          break;
        }
        case "create-physics-rope": {
          this._createPhysicsRope();
          break;
        }
      }
"@

$newContent = $content -replace [regex]::Escape($searchPattern), $replacement
$newContent | Set-Content $filePath -NoNewline

Write-Host "Handler added successfully!"
