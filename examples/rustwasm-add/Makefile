all: release

ESP = ../../bin/es-pack
ci:
	make node browser
node:
	make release && $(ESP) build --rustwasm && $(ESP) test --node
browser:
	make release && $(ESP) build --rustwasm && $(ESP) test --browser

dev:
	RUSTFLAGS="-Z macro-backtrace" wasm-pack build --dev --target no-modules
release:
	wasm-pack build --release --target no-modules
test:
	wasm-pack test --headless --chrome

clean:
	rm -rf ./pkg/*
