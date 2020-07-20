
# Whitefoo Bank API

## Front-end repository: [web2-2020c](https://github.com/ktt45678/web2-2020c)

This project was generated with [npm](https://github.com/npm/cli) version 6.14.4, [Nodejs](https://github.com/nodejs/node) version 12.18.0.

[VI]
đây là backend của web ngân hàng whitefoo:

    - thư mục constants: khai báo các biến cố định hoặc mảng cố định muốn mặc định gì đó, cũng có thể là arr thông báo lỗi, 1 số slogans, Regex pattern....
    - thư mục helpers: chứa các hàm xử lý ngoài: ép kiểu ngày tháng, cắt chuỗi theo nhu cầu, các hàm random(string,number),
    mã hóa ngoài, xử lý Regex...
    - thư mục middleware, services công dụng sẽ như đã học
    - thư mục routes để khai báo dùng hàm nào cho đường dẫn nào, dẫn đến thư mục controller.
    - thư mục controller để khai báo các hàm sử dụng ở routes
    - nếu có chỉnh sửa cấu trúc thư mục hoặc logic cấu trúc, VUI LÒNG THÔNG BÁO LÊN NHÓM CHO MỌI NGƯỜI BIẾT, NHẤT LÀ TEAM BACKEND


[ENG]
whitefoo bank project's backend

    - constants folder : contains declaration of fixed arrays , constants , slogans , regular expression patterns ...
    - helpers folder : contains utility functions (date time formatting , string processing , randomizing , encripting , regex handling)
    - controllers : contains declaration of functions used in routes folder
    - routes folder : routing for function calls ( will be called from controllers )
    - middleware folder and service folder : contains utility functions and data fetching
    - In case of changing folder's structure or logical structure , PLEASE INFORM OTHER GROUP MEMBERS ESPECIALLY THE BACKEND TEAM
    