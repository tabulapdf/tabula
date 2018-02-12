import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

import static junit.framework.TestCase.assertTrue;

public class TestHomePage {
    @Test
    public static void main(String[] args){
        WebDriver driver = new FirefoxDriver();
        driver.get("http://127.0.0.1:9292/");
        try{ //clicking all the menu tabs on the homepage
            driver.findElement(By.className("navbar-brand")).click();
            driver.findElement(By.id("upload-nav")).click();
            driver.findElement(By.id("templates-nav")).click();
            String text_template = "My Saved Templates";
            assertTrue("Failed",text_template.equals(driver.findElement(By.className("my_saved_template_title")).getText()));
            driver.navigate().back();
            driver.findElement(By.id("about-nav")).click();
            assertTrue("Failed","About Tabula".equals(driver.findElement(By.className("about_tabula")).getText()));
            driver.navigate().back();
            driver.findElement(By.id("help-nav")).click();
            assertTrue("Failed","How to Use Tabula".equals(driver.findElement(By.name("howto")).getText()));
            driver.navigate().back();

            driver.quit();
        }catch(Exception e){
            System.out.print(e);
        }

    }
}
