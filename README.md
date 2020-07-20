
# Whitefoo Bank API

This project was generated with [npm](https://github.com/npm/cli) version 6.14.4, [Nodejs](https://github.com/nodejs/node) version 12.18.0.


## Front-end repository: [web2-2020c](https://github.com/ktt45678/web2-2020c)

## Development server

Run `npm start` to start the server once. Navigate to `http://localhost:3000/`.

Run `npm run dev` to start the dev server. Navigate to `http://localhost:3000/`. The app will automatically reload if you change any of the source files.

## Folders structure
[VI]

    - thư mục constants: khai báo các biến cố định hoặc mảng cố định muốn mặc định gì đó, cũng có thể là arr thông báo lỗi, 1 số slogans, Regex pattern....
    
    - thư mục helpers: chứa các hàm xử lý ngoài: ép kiểu ngày tháng, cắt chuỗi theo nhu cầu, các hàm random(string,number),mã hóa ngoài, xử lý Regex...

    - thư mục middleware, services

    - thư mục routes để khai báo dùng hàm nào cho đường dẫn nào, dẫn đến thư mục controller.

    - thư mục controller để khai báo các hàm sử dụng ở routes

[ENG]

    - constants folder : contains declaration of fixed arrays , constants , slogans , regular expression patterns ...

    - helpers folder : contains utility functions (date time formatting , string processing , randomizing , encrypting , regex handling)

    - controllers : contains declaration of functions used in routes folder

    - routes folder : routing for function calls ( will be called from controllers )

    - middleware folder and service folder : contains utility functions and data fetching
    
## Third party used

Api get exchange rate: [freeforexapi](https://www.freeforexapi.com/Home/Api)

[Google reCAPTCHA v2](https://www.google.com/recaptcha/)