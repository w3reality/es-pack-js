use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use js_sys::{Function, Object, Reflect};

#[wasm_bindgen]
extern "C" {
    type MyClass;

    #[wasm_bindgen(method, getter)]
    fn number(this: &MyClass) -> u32;
    #[wasm_bindgen(method, setter)]
    fn set_number(this: &MyClass, number: u32) -> MyClass;
    #[wasm_bindgen(method)]
    fn render(this: &MyClass) -> String;
}

fn create<T: From<wasm_bindgen::JsValue>>(ffi: Object, item: &str) -> Result<T, JsValue> {
    // `ffi[item]`
    let clazz = Reflect::get(ffi.as_ref(), &item.into())?
        .dyn_into::<Function>()?;

    //==== Given `clazz`, how to dynamically call `new T()` in Rust?
    // let x: T = ??clazz??;
    //==== hack: use custom 'static constructor' method: `T.create()`
    let x: T = Reflect::get(clazz.as_ref(), &"create".into())?
        .dyn_into::<Function>()?
        .call0(&JsValue::undefined())?
        .into();

    Ok(x)
}

#[wasm_bindgen]
pub fn run(ffi: Object) -> Result<u32, JsValue> {
    let x = create::<MyClass>(ffi, "MyClass").unwrap();
    
    assert_eq!(x.number(), 42);
    x.set_number(10);
    assert_eq!(x.render(), "My number is: 10");

    Ok(x.number())
}
