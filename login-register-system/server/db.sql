create database if not exists login_register_system character set utf8mb4 collate utf8mb4_general_ci;
use login_register_system;

create table if not exists users
(
	id int auto_increment primary key,
    userid varchar(50) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL,
    name varchar(50) NOT NULL,
    sex ENUM('M','F','O') NULL,
    age TINYINT,
    mbti varchar(4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);