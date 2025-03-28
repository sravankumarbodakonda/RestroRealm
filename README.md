To set up the project on a new device, follow these steps:

---

### Local Setup Guide

1. **Clone the Repository**  
   Run the following command to clone the repo:  
   ```bash
   git clone https://github.com/saigirishpabbathi/RestroRealm.git
   ```

2. **Create a Database**  
   - Open MySQL Workbench or your preferred MySQL client.  
   - Create a new database named `restrorealm`.  
     ```sql
     CREATE DATABASE restrorealm;
     ```

3. **Update Database Credentials**  
   - Navigate to the `src/main/resources/application.properties` file in the cloned project.  
   - Update the following properties with your MySQL credentials:  
     ```properties
     spring.datasource.url = jdbc:mysql://localhost:3306/restrorealm
     spring.datasource.username = <your-mysql-username>
     spring.datasource.password = <your-mysql-password>
     ```  
   - **Note:** Only update the above three properties. Do not modify any other configurations.

4. **Run the Backend Application**  
   - Open the project in your favorite IDE (e.g., IntelliJ IDEA, Eclipse).  
   - Run the Spring Boot application located in the `src/main/java` directory.  

5. **Set Up the Frontend Application**  
   - Open the `src/restrorealm` folder in VS Code or your preferred code editor.  
   - Install the required dependencies by running:  
     ```bash
     npm install
     ```  
   - Start the frontend development server:  
     ```bash
     ng serve
     ```  
   - The application should now be accessible at `http://localhost:4200`.

6. **Add Initial Data to the Database**  
   - Use MySQL Workbench or a similar tool to add the provided initial data to the `restrorealm` database.  
   - Ensure the data matches the schema expected by the application.

---

### Notes:
- Ensure MySQL is installed and running on your device.  
- Replace `<your-mysql-username>` and `<your-mysql-password>` with your actual MySQL credentials.  
- If you encounter any issues, refer to the project's documentation or reach out to the maintainers.  

Happy coding! 🚀


## For Data
- `INSERT INTO role (name, description, deleted, created_at, updated_at) VALUES("SuperAdmin", "Super Admin for managing Overall Site", False, now(), now());`
- `INSERT INTO role (name, description, deleted, created_at, updated_at) VALUES("User", "User is refered to as customer", False, now(), now());`
