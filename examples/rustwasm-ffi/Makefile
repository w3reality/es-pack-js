all: release

node:# temp!!!!
	make release && esp build --rustwasm && esp test --node
browser:# temp!!!!
	make release && esp build --rustwasm && esp test --browser

dev:
	RUSTFLAGS="-Z macro-backtrace" wasm-pack build --dev --target no-modules
release:
	wasm-pack build --release --target no-modules
test:
	wasm-pack test --headless --chrome

clean:
	rm -rf ./pkg/*
