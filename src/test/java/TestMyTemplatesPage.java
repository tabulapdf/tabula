import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.io.File;
import java.nio.file.Files;
import static java.nio.file.StandardCopyOption.*;

import static junit.framework.TestCase.assertTrue;

// Test of Tabula's My Templates' page and it's associating links. It clicks through the navigating links and the
//  browsing button. Additionally, the media menu is not tested for since it is already tested in TestHomePage.
//  @author SM modified: 2/23/18
public class TestMyTemplatesPage {
    WebDriver driver;
    @Test
    public void startWebDriver(){
        System.setProperty("webdriver.chrome.driver","/usr/local/bin/chromedriver");
        ChromeOptions options = new ChromeOptions();
        options.addArguments("headless");
        options.addArguments("no-sandbox");

        driver = new ChromeDriver(options);
        driver.get("http://127.0.0.1:9292/");
        driver.manage().window().maximize();
        WebDriverWait wait = new WebDriverWait(driver, 100);
        try{
            //navigates to the My Templates tab from the homepage tab
            By templates_id = By.linkText("My Templates");
            WebElement templates_icon = wait.until(ExpectedConditions.visibilityOfElementLocated(templates_id));
            templates_icon.click();
            WebElement templates_icon2 = wait.until(ExpectedConditions.visibilityOfElementLocated(templates_id));
            templates_icon2.click();
            String text_template = "My Saved Templates";
            By saved_template_classname = By.className("my_saved_template_title");
            WebElement template_title = wait.until(ExpectedConditions.visibilityOfElementLocated(saved_template_classname));
            assertTrue("Failed, couldn't find My Templates page", text_template.equals(template_title.getText()));

            //checks links and browsing button
            By upload_text = By.linkText("upload a file");
            WebElement upload_link = wait.until(ExpectedConditions.visibilityOfElementLocated(upload_text));
            upload_link.click();
            String homepagecheck = "First time using Tabula? Welcome!";
            By welcome_id = By.id("welcome_title");
            WebElement welcome = wait.until(ExpectedConditions.visibilityOfElementLocated(welcome_id));
            assertTrue("Failed, couldn't find My Upload a file in the Home page", homepagecheck.equals(welcome.getText()));
            driver.navigate().back();

            By myfiles_text = By.linkText("My Files");
            WebElement myfiles_link = wait.until(ExpectedConditions.visibilityOfElementLocated(myfiles_text));
            myfiles_link.click();
            By welcome_id2 = By.id("welcome_title");
            WebElement welcome2 = wait.until(ExpectedConditions.visibilityOfElementLocated(welcome_id2));
            assertTrue("Failed, couldn't find My Upload a file in the Home page", homepagecheck.equals(welcome2.getText()));
            driver.navigate().back();

            //Checking Browse button, which will open up File Explorer
            By input_btn = By.className("input-group-btn");
            WebElement input_browser = wait.until(ExpectedConditions.elementToBeClickable(input_btn));
            input_browser.click();
            //utilizing thread.sleep() to give enough time for the file explorer to display correctly. 
            Thread.sleep(1000);

        }catch(Exception e){
            System.out.print("TestMyTemplatesPage failed.");
            System.out.print(e);
        }
    }

    @Before 
    public void Setup() {
        try{
            Files.move(new File("~/.tabula/pdfs/workspace.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), new File("~/.tabula/workspace_moved_for_tests.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), REPLACE_EXISTING);

        } catch (java.io.IOException e) {
        }
    }

        //whether the test case passes or not, the instance of the browser will close
    @After
    public void TearDown(){
        try{
            Files.move(new File("~/.tabula/workspace_moved_for_tests.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), new File("~/.tabula/pdfs/workspace.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), REPLACE_EXISTING);

        } catch (java.io.IOException e) {
        }

        driver.quit();
    }
}
