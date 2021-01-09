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

#[wasm_bindgen]
pub fn run(ffi: Object) -> Result<u32, JsValue> {
    // `ffi.MyClass`
    let my_class = Reflect::get(ffi.as_ref(), &"MyClass".into())?
        .dyn_into::<Function>()?;

    //==== Given `my_class`, how to dynamically call `new MyClass()` in Rust?
    // let x: MyClass = ??my_class??;
    //==== hack: `MyClass.create()`
    let x: MyClass = Reflect::get(my_class.as_ref(), &"create".into())?
        .dyn_into::<Function>()?
        .call0(&JsValue::undefined())?
        .into();
    
    assert_eq!(x.number(), 42);
    x.set_number(10);
    assert_eq!(x.render(), "My number is: 10");

    Ok(x.number())
}
