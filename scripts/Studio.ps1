# غلاف PowerShell لأداة studio.py
# أمثلة:
#   .\Studio.ps1 check
#   .\Studio.ps1 new -Type remotion -Name Promo_01     (يُستخدم -Type و -Name كما في studio.py)
#   .\Studio.ps1 export --input clip.mov --preset web_1080p
#   .\Studio.ps1 new -Type remotion -Template logo -Brand example -Name Intro_01
#   .\Studio.ps1 render -Project Intro_01 -Comp Logo-Intro-16x9 -Preview
[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $Arguments
)

$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'studio.py'

# تحويل -Type/-Name إلى الصيغة التي يفهمها argparse
$converted = @()
foreach ($a in $Arguments) {
    switch -Regex ($a) {
        '^-Type$'  { $converted += '--type'; continue }
        '^-Name$'  { $converted += '--name'; continue }
        '^-Input$' { $converted += '--input'; continue }
        '^-Preset$' { $converted += '--preset'; continue }
        '^-Project$' { $converted += '--project'; continue }
        '^-(Template|Brand|Comp|Frames|Props|Scale|Preview|Alpha|Overwrite|Shot|Format|Percent|Samples|Transparent|Product|Bpm|Bars)$' { $converted += ('--' + $Matches[1].ToLower()); continue }
        '^-ToRemotion$' { $converted += '--to-remotion'; continue }
        '^-NoEncode$' { $converted += '--no-encode'; continue }
        default    { $converted += $a }
    }
}

& python $script @converted
exit $LASTEXITCODE
