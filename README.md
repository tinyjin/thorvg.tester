# ThorVG Tester

```
⚠️ [WIP] This currently supports comparing ThorVG to only LottieFiles
```

ThorVG Tester is unofficial graphic renderer testing tool for ThorVG Engine. It works on web browser and detects rendering error by comparing canvas outputs, automatically.

https://github.com/tinyjin/thorvg.tester/assets/11167117/b4df338a-d4e1-4671-b1ca-c4ccc1fdf3ec



# Usage

## GUI
Click to use [ThorVG Tester](https://thorvg-tester.vercel.app)

## CLI
```sh
npm install -g https://github.com/tinyjin/thorvg.tester
tvg-cli /path/to/target-dir
```

## Review with PDF

When test is done, system will provide you with PDF that includes test results, you can simply check and review.
- GUI : Will automatically open PDF on new tab
- CLI : Generates `result.pdf` in your current directory

![pdf-example](./docs/pdf-example.png)

## Others

[ThorVG Project](https://github.com/thorvg/thorvg)
