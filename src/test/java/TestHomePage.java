import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

public class TestHomePage {
    @Test
    public static void main(String[] args){
        WebDriver driver = new FirefoxDriver();
        driver.get("http://127.0.0.1:9292/");
        try{ //clicking all the menu tabs on the homepage
            driver.findElement(By.className("navbar-brand")).click();
            driver.findElement(By.id("upload-nav")).click();
            driver.findElement(By.id("templates-nav")).click();
            String template_text = driver.findElement(By.className("my_saved_template_title")).getText() ;
            if(template_text == "My Saved Templates"){
                driver.navigate().back();
                System.out.print("PASS");
            }
            else{
                System.out.print("FAIL");
            }
            driver.findElement(By.id("about-nav")).click();
            driver.navigate().back();
            driver.findElement(By.id("help-nav")).click();
            driver.navigate().back();
            Thread.sleep(3000);
            driver.quit();
        }catch(Exception e){
            System.out.print(e);
        }

    }
}
