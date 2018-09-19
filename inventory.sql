CREATE TABLE inventory(
  inv_id INT NOT NULL AUTO_INCREMENT,
  inv_items INT NOT NULL REFERENCES item(item_id),
  description VARCHAR(100) NOT NULL,
  category VARCHAR(25) DEFAULT 'unknown',
  date_recieved TIMESTAMP DEFAULT NOW(),
  storage_location VARCHAR(4) NOT NULL,
  present VARCHAR(5) NOT NULL,
  reserved VARCHAR(5) DEFAULT 'false',
  PRIMARY KEY(inv_id)
);
CREATE TABLE inventory(
  inv_id SERIAL,
  description VARCHAR(100) NOT NULL,
  category VARCHAR(25) DEFAULT 'unknown',
  date_recieved TIMESTAMP DEFAULT NOW(),
  storage_location VARCHAR(4) NOT NULL,
  present VARCHAR(5) NOT NULL,
  reserved VARCHAR(5) DEFAULT 'false',
  PRIMARY KEY(inv_id)
);
CREATE TABLE item(
  item_id INT NOT NULL AUTO_INCREMENT,
  description VARCHAR(100) NOT NULL,
  category VARCHAR(25) DEFAULT 'unknown',
  date_recieved TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY(item_id)
);
CREATE TABLE user(
  user_id INT NOT NULL AUTO_INCREMENT,
  user_name VARCHAR(100) NOT NULL,
  user_mobile VARCHAR(100) NOT NULL,
  user_email VARCHAR(100) NOT NULL,
  user_address VARCHAR(100) NOT NULL,
  manages_project INT NOT NULL REFERENCES project(project_id),
  date_started TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY(user_id)
);
CREATE TABLE project(
  project_id INT NOT NULL AUTO_INCREMENT,
  description VARCHAR(100) NOT NULL,
  project_items INT NOT NULL REFERENCES item(item_id),
  manager INT NOT NULL REFERENCES user(user_id),
  date_started TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY(project_id)
);